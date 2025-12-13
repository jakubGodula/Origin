import React from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { MARKETPLACE_ID, PACKAGE_ID } from '@/utils/constants';
import { Transaction } from '@mysten/sui/transactions';

export function useIsAdmin() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function checkAdmin() {
            if (!account) {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }

            try {
                // Create a transaction to call the is_admin function
                const tx = new Transaction();
                tx.moveCall({
                    target: `${PACKAGE_ID}::marketplace::is_admin`,
                    arguments: [
                        tx.object(MARKETPLACE_ID),
                        tx.pure.address(account.address)
                    ],
                });

                // Inspect the transaction (dry run)
                const result = await suiClient.devInspectTransactionBlock({
                    sender: account.address,
                    transactionBlock: tx,
                });

                if (result.results && result.results[0]) {
                    const returnValues = result.results[0].returnValues;
                    if (returnValues && returnValues[0]) {
                        const [bytes] = returnValues[0];
                        // The first byte indicates boolean value: 0 = false, 1 = true
                        const isAdminValue = bytes[0] === 1;
                        setIsAdmin(isAdminValue);
                    }
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        }

        checkAdmin();
    }, [account, suiClient]);

    return { isAdmin, isLoading };
}

