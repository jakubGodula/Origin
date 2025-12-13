import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { MARKETPLACE_ID, PACKAGE_ID } from '@/utils/constants';
import { Transaction } from '@mysten/sui/transactions';

export function useIsSuperAdmin() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkSuperAdminStatus() {
            if (!account?.address) {
                setIsSuperAdmin(false);
                setLoading(false);
                return;
            }

            try {
                // Use devInspectTransactionBlock to check is_super_admin
                const tx = new Transaction();
                tx.moveCall({
                    target: `${PACKAGE_ID}::marketplace::is_super_admin`,
                    arguments: [
                        tx.object(MARKETPLACE_ID),
                        tx.pure.address(account.address),
                    ],
                });

                const result = await suiClient.devInspectTransactionBlock({
                    sender: account.address,
                    transactionBlock: tx,
                });

                // Parse the result - is_super_admin returns bool
                if (result.results && result.results[0]) {
                    const returnValues = result.results[0].returnValues;
                    if (returnValues && returnValues[0]) {
                        const [bytes] = returnValues[0];
                        // First byte is the boolean value
                        const isSuperAdminValue = bytes[0] === 1;
                        setIsSuperAdmin(isSuperAdminValue);
                    }
                }
            } catch (error) {
                // Function doesn't exist on deployed contract
                // Fall back to checking if user is the primary admin (old behavior)
                if (error instanceof Error && error.message.includes('function')) {
                    console.log('is_super_admin function not found, using fallback to primary admin check');
                    try {
                        // Query marketplace to get primary admin
                        const marketplaceObj = await suiClient.getObject({
                            id: MARKETPLACE_ID,
                            options: { showContent: true },
                        });

                        if (marketplaceObj.data?.content?.dataType === 'moveObject') {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const fields = marketplaceObj.data.content.fields as any;
                            const primaryAdmin = fields?.admin;
                            const isSuperAdminFallback = account.address === primaryAdmin;
                            console.log('Fallback check:', {
                                accountAddress: account.address,
                                primaryAdmin,
                                isSuperAdmin: isSuperAdminFallback
                            });
                            setIsSuperAdmin(isSuperAdminFallback);
                        } else {
                            console.warn('Could not get marketplace object fields');
                            setIsSuperAdmin(false);
                        }
                    } catch (fallbackError) {
                        console.error('Error in fallback super admin check:', fallbackError);
                        setIsSuperAdmin(false);
                    }
                } else {
                    console.error('Error checking super admin status:', error);
                    setIsSuperAdmin(false);
                }
            } finally {
                setLoading(false);
            }
        }

        checkSuperAdminStatus();
    }, [account?.address, suiClient]);

    return { isSuperAdmin, loading };
}
