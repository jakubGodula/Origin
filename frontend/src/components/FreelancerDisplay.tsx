import React from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { CANDIDATE_PROFILE_TYPE } from '@/utils/constants';
import Link from 'next/link';

interface FreelancerDisplayProps {
    address: string;
    showLink?: boolean;
}

export function FreelancerDisplay({ address, showLink = true }: FreelancerDisplayProps) {
    const { data: profileData, isLoading } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: address,
            filter: { StructType: CANDIDATE_PROFILE_TYPE },
            options: { showContent: true }
        }
    );

    const profileId = profileData?.data?.[0]?.data?.objectId;
    const profile = profileData?.data?.[0]?.data?.content?.dataType === 'moveObject'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (profileData.data[0].data.content.fields as any)
        : null;

    if (isLoading) return <span className="animate-pulse bg-white/10 rounded px-2">...</span>;

    const displayId = profileId || `${address.slice(0, 6)}...${address.slice(-4)}`;
    const displayName = profile?.name || 'Unknown Freelancer';

    if (!showLink) {
        return <span title={address}>{displayName} ({displayId})</span>;
    }

    return (
        <div className="flex flex-col">
            <span className="text-white font-medium">{displayName}</span>
            <Link
                href={`/profile/view?id=${profileId}`}
                className="text-xs text-zinc-400 hover:text-primary transition-colors font-mono"
                title={`Wallet: ${address}`}
            >
                ID: {displayId.slice(0, 10)}...
            </Link>
        </div>
    );
}
