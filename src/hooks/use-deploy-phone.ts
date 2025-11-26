
'use client';

import { useState, useTransition } from 'react';
import { useActiveAgent } from '@/app/(main)/layout';
import { searchAvailableNumbers, purchaseAndConfigureNumber } from '@/app/actions/twilio';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

interface TwilioNumber {
    friendlyName: string;
    phoneNumber: string;
}

export function useDeployPhone() {
    const { user } = useUser();
    const { activeAgent, setActiveAgent } = useActiveAgent();
    const { toast } = useToast();
    const [isSearching, startSearchTransition] = useTransition();
    const [isPurchasing, startPurchaseTransition] = useTransition();

    const [country, setCountry] = useState('US');
    const [areaCode, setAreaCode] = useState('');
    const [availableNumbers, setAvailableNumbers] = useState<TwilioNumber[]>([]);
    const [purchasingNumber, setPurchasingNumber] = useState<string | null>(null);

    const handleSearch = () => {
        if (!areaCode) {
            toast({ title: 'Area code is required', variant: 'destructive'});
            return;
        }
        setAvailableNumbers([]);
        startSearchTransition(async () => {
            const result = await searchAvailableNumbers(country, areaCode);
            if ('error' in result) {
                toast({ title: 'Search Failed', description: result.error, variant: 'destructive'});
            } else {
                setAvailableNumbers(result.data || []);
                if (!result.data || result.data.length === 0) {
                     toast({ title: 'No Numbers Found', description: 'Try a different area code or country.'});
                }
            }
        });
    }

    const handlePurchase = (numberToPurchase: string) => {
        if (!user || !activeAgent?.id) {
            toast({ title: 'Error', description: 'You must be logged in and have an active agent.', variant: 'destructive' });
            return;
        }
        setPurchasingNumber(numberToPurchase);
        startPurchaseTransition(async () => {
            const result = await purchaseAndConfigureNumber(user.uid, activeAgent.id!, numberToPurchase);
            if ('error' in result) {
                toast({ title: 'Purchase Failed', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: 'Purchase Successful!', description: `Number ${result.purchasedNumber} is now assigned to your agent.` });
                // Update agent context
                if(activeAgent) {
                  const newPhoneConfig = { phoneNumber: result.purchasedNumber, phoneSid: '' }; // SID is not returned here but it's ok for UI
                  setActiveAgent({ ...activeAgent, phoneConfig: newPhoneConfig });
                }
                setAvailableNumbers([]); // Clear the list after purchase
            }
            setPurchasingNumber(null);
        });
    };

    return {
        activeAgent,
        country,
        setCountry,
        areaCode,
        setAreaCode,
        availableNumbers,
        isSearching,
        isPurchasing,
        purchasingNumber,
        handleSearch,
        handlePurchase,
    };
}
