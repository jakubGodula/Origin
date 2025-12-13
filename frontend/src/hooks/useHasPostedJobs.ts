import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useState, useEffect } from 'react';
import { PACKAGE_ID } from '@/utils/constants';

export function useHasPostedJobs() {
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const [hasPostedJobs, setHasPostedJobs] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkPostedJobs() {
            if (!account?.address) {
                setHasPostedJobs(false);
                setLoading(false);
                return;
            }

            try {
                // Query for Job objects owned by the user
                const ownedObjects = await suiClient.getOwnedObjects({
                    owner: account.address,
                    filter: {
                        StructType: `${PACKAGE_ID}::listing::Job`,
                    },
                    options: {
                        showType: true,
                    },
                });

                // User has posted jobs if they own any Job objects
                setHasPostedJobs(ownedObjects.data.length > 0);
            } catch (error) {
                console.error('Error checking posted jobs:', error);
                setHasPostedJobs(false);
            } finally {
                setLoading(false);
            }
        }

        checkPostedJobs();
    }, [account?.address, suiClient]);

    return { hasPostedJobs, loading };
}
