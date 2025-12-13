import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { PACKAGE_ID, ESCROW_MODULE } from '../utils/constants';
import { SuiObjectResponse } from '@mysten/sui/client';

export interface Escrow {
    id: string;
    job_id: string;
    employer: string;
    freelancer: string;
    creator: string; // New field
    amount: string; // Stored as u64 MIST, now formatted
    dispute_active: boolean;
    released: boolean; // Renamed from finalized to match contract
    work_oid: string | null;
    created_at: string; // Type changed from number to string
    // Helper fields
    status: 'Active' | 'Disputed' | 'Released' | 'Delivered';
}

export const parseEscrowFromSuiObject = (obj: SuiObjectResponse): Escrow | null => {
    if (obj.error || !obj.data) return null;
    const fields = obj.data.content?.dataType === 'moveObject' ? (obj.data.content.fields as any) : null;
    if (!fields) return null;

    // Helper to extract string from Option<String>
    let workOid: string | null = null;

    // Debug logging
    // console.log("Parsing Escrow ID:", obj.data.objectId, "Fields:", fields);

    if (fields.work_oid) {
        // Handle Option structure: usually { fields: { vec: [value] } }
        const vec = fields.work_oid.fields?.vec || fields.work_oid.vec;

        if (Array.isArray(vec) && vec.length > 0) {
            const inner = vec[0];
            // 2. Inner might be a String struct or raw string
            if (typeof inner === 'string') {
                workOid = inner;
            } else if (inner?.fields?.bytes) {
                // It's a String struct with bytes
                workOid = inner.fields.bytes;
            } else if (typeof inner === 'object') {
                // Fallback: try to see if it has 'bytes' property directly
                if ('bytes' in inner) {
                    workOid = (inner as any).bytes;
                } else {
                    workOid = JSON.stringify(inner);
                }
            }
        }
    }

    const status = fields.dispute_active ? 'Disputed' :
        fields.released ? 'Released' :
            (workOid || fields.freelancer_delivered) ? 'Delivered' : 'Active';

    // Amount parsing
    const amountVal = fields.amount?.fields?.value || fields.amount || "0";

    return {
        id: obj.data.objectId,
        creator: fields.creator,
        freelancer: fields.freelancer,
        employer: fields.employer,
        job_id: fields.job_id,
        amount: (parseInt(amountVal) / 1_000_000_000).toFixed(2), // MIST to SUI
        work_oid: workOid,
        dispute_active: fields.dispute_active,
        released: fields.released,
        created_at: new Date(Number(fields.created_at)).toLocaleDateString(),
        status
    };
};

export function useEscrows() {
    const client = useSuiClient();

    return useQuery({
        queryKey: ['escrows'],
        queryFn: async (): Promise<Escrow[]> => {
            // 1. Fetch EscrowCreated events
            const events = await client.queryEvents({
                query: {
                    MoveModule: {
                        package: PACKAGE_ID,
                        module: ESCROW_MODULE,
                    },
                },
                order: 'descending',
            });

            // Filter for EscrowCreated
            const createdEvents = events.data.filter(
                (event) => event.type.includes('::EscrowCreated')
            );

            if (createdEvents.length === 0) {
                return [];
            }

            // 2. Get object IDs
            const escrowIds = createdEvents.map((event) => (event.parsedJson as any).escrow_id);

            // 3. Fetch objects
            const objects = await client.multiGetObjects({
                ids: escrowIds,
                options: {
                    showContent: true,
                },
            });

            // 4. Map to Escrow interface
            const escrows = objects.map(parseEscrowFromSuiObject).filter((e): e is Escrow => e !== null);

            return escrows;
        },
    });
}
