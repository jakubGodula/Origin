import React from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { MARKETPLACE_ID, PACKAGE_ID } from '@/utils/constants';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

export function useModeratorLanguages() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const [languages, setLanguages] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchLanguages() {
            if (!account) {
                setLanguages([]);
                setIsLoading(false);
                return;
            }

            try {
                const tx = new Transaction();
                tx.moveCall({
                    target: `${PACKAGE_ID}::marketplace::get_moderator_languages`,
                    arguments: [
                        tx.object(MARKETPLACE_ID),
                        tx.pure.address(account.address)
                    ],
                });

                const result = await suiClient.devInspectTransactionBlock({
                    sender: account.address,
                    transactionBlock: tx,
                });

                if (result.results && result.results[0]) {
                    const returnValues = result.results[0].returnValues;
                    if (returnValues && returnValues[0]) {
                        const [bytes] = returnValues[0];
                        // Decode vector<String>
                        // Move String is wrapper around vector<u8> (bytes)
                        // So we are looking for vector<vector<u8>> basically
                        const decoded = bcs.vector(bcs.string()).parse(new Uint8Array(bytes));
                        setLanguages(decoded);
                    }
                }
            } catch (error) {
                console.error('Error fetching moderator languages:', error);
                setLanguages([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchLanguages();
    }, [account, suiClient]);

    return { languages, isLoading };
}
