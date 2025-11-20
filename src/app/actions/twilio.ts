'use server';

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.warn('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) are not configured.');
}

const client = twilio(accountSid, authToken);

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
