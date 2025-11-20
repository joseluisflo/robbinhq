'use server';

import twilio from 'twilio';
import { firebaseAdmin } from '@/firebase/admin';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;


if (!accountSid || !authToken) {
  console.warn('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) are not configured.');
}

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

interface TwilioNumber {
    friendlyName: string;
    phoneNumber: string;
}

export async function searchAvailableNumbers(countryCode: string, areaCode: string): Promise<{ data?: TwilioNumber[] } | { error: string }> {
    if (!client) {
        return { error: 'Twilio client is not initialized. Please check server credentials.' };
    }
    
    try {
        const availableNumbers = await client.availablePhoneNumbers(countryCode).local.list({
            areaCode: areaCode || undefined,
            limit: 10
        });

        if (availableNumbers.length === 0) {
            return { data: [] };
        }

        const formattedNumbers = availableNumbers.map(num => ({
            friendlyName: num.friendlyName,
            phoneNumber: num.phoneNumber
        }));

        return { data: formattedNumbers };

    } catch (error: any) {
        console.error('Failed to search for Twilio numbers:', error);
        // Provide a more user-friendly error message
        if (error.code === 20003) {
             return { error: 'Twilio authentication failed. Please check your Account SID and Auth Token.' };
        }
        if (error.code === 21614) {
             return { error: `No numbers found for area code '${areaCode}'. Try a different one.` };
        }
        return { error: error.message || 'An unknown error occurred while searching for numbers.' };
    }
}


export async function purchaseAndConfigureNumber(
  userId: string,
  agentId: string,
  phoneNumber: string
): Promise<{ success: boolean, purchasedNumber: string } | { error: string }> {
  if (!client) {
    return { error: 'Twilio client is not initialized. Please check server credentials.' };
  }
  if (!appUrl) {
    return { error: 'Application URL (NEXT_PUBLIC_APP_URL) is not configured.' };
  }

  try {
    // 1. Purchase the number
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
    });
    
    const phoneSid = purchasedNumber.sid;

    // 2. Configure the voice webhook
    const voiceWebhookUrl = `${appUrl}/api/twilio/voice?agentId=${agentId}`;
    await client.incomingPhoneNumbers(phoneSid).update({
      voiceUrl: voiceWebhookUrl,
      voiceMethod: 'POST',
    });

    // 3. Save to Firestore
    const firestore = firebaseAdmin.firestore();
    const agentRef = firestore.collection('users').doc(userId).collection('agents').doc(agentId);
    await agentRef.update({
        phoneConfig: {
            phoneNumber: purchasedNumber.phoneNumber,
            phoneSid: phoneSid,
        }
    });

    return { success: true, purchasedNumber: purchasedNumber.phoneNumber };

  } catch (error: any) {
    console.error(`Failed to purchase or configure number ${phoneNumber}:`, error);
     if (error.code === 21452) { // Number already taken
        return { error: `The number ${phoneNumber} is no longer available. Please search again.` };
    }
    return { error: error.message || 'An unknown error occurred during purchase.' };
  }
}
