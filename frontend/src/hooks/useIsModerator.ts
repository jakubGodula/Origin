import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { MARKETPLACE_ID, PACKAGE_ID } from '@/utils/constants';
import { Transaction } from '@mysten/sui/transactions';

export function useIsModerator() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const [isModerator, setIsModerator] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkModeratorStatus() {
            if (!account?.address) {
                setIsModerator(false);
                setLoading(false);
                return;
            }

            try {
                // Use devInspectTransactionBlock to check is_moderator
                const tx = new Transaction();
                tx.moveCall({
                    target: `${PACKAGE_ID}::marketplace::is_moderator`,
                    arguments: [
                        tx.object(MARKETPLACE_ID),
                        tx.pure.address(account.address),
                    ],
                });

                const result = await suiClient.devInspectTransactionBlock({
                    sender: account.address,
                    transactionBlock: tx,
                });

                // Parse the result - is_moderator returns bool
                if (result.results && result.results[0]) {
                    const returnValues = result.results[0].returnValues;
                    if (returnValues && returnValues[0]) {
                        const [bytes] = returnValues[0];
                        // First byte is the boolean value
                        const isModeratorValue = bytes[0] === 1;
                        setIsModerator(isModeratorValue);
                    }
                }
            } catch (error) {
                // Silently handle missing function - contract hasn't been deployed yet
                // Don't log error to avoid console spam
                if (error instanceof Error && error.message.includes('function')) {
                    // Function doesn't exist, moderator system not deployed
                    setIsModerator(false);
                } else {
                    // Other error, log it
                    console.error('Error checking moderator status:', error);
                    setIsModerator(false);
                }
            } finally {
                setLoading(false);
            }
        }

        checkModeratorStatus();
    }, [account?.address, suiClient]);

    return { isModerator, loading };
}
