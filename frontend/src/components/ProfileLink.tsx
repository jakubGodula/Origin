"use client";

import { useSuiClientQuery } from '@mysten/dapp-kit';
import Link from 'next/link';
import { CANDIDATE_PROFILE_TYPE, EMPLOYER_PROFILE_TYPE } from '@/utils/constants';

interface ProfileLinkProps {
    address: string;
    type: 'candidate' | 'employer';
    className?: string;
    children: React.ReactNode;
}

export function ProfileLink({ address, type, className, children }: ProfileLinkProps) {
    const structType = type === 'candidate' ? CANDIDATE_PROFILE_TYPE : EMPLOYER_PROFILE_TYPE;

    const { data, isLoading } = useSuiClientQuery('getOwnedObjects', {
        owner: address,
        filter: {
            StructType: structType
        },
        options: {
            showContent: true // Not strictly needed just for ID, but good for debugging if needed
        }
    });

    const objectId = data?.data?.[0]?.data?.objectId;

    if (isLoading) {
        return <span className={`${className} opacity-50 cursor-wait`}>{children}</span>;
    }

    if (objectId) {
        return (
            <Link href={`/profile/view?id=${objectId}`} className={className}>
                {children}
            </Link>
        );
    }

    // Fallback: if no profile found, just show the address/text without link or with a dead link
    return (
        <span className={className} title="Profile not found">
            {children}
        </span>
    );
}
