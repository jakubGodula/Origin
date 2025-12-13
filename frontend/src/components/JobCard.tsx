"use client";

import React from 'react';
import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';

interface JobCardProps {
    id: string;
    title: string;
    description: string;
    price: string;
    tags: string[];
    postedBy: string;
    postedAt: string;
    durationValue: number;
    durationUnit: number;
    location: string;
    locationRequired: boolean;
    applicantCount?: number;
}

const getDurationLabel = (value: number, unit: number) => {
    if (unit === 0) return 'Indefinite';
    const units = ['', 'Hour', 'Day', 'Month'];
    const unitLabel = units[unit] || '';
    return `${value} ${unitLabel}${value > 1 ? 's' : ''} `;
};

export const JobCard: React.FC<JobCardProps> = ({
    id,
    title,
    description,
    price,
    tags,
    postedBy,
    postedAt,
    durationValue,
    durationUnit,
    location,
    locationRequired,
    applicantCount = 0
}) => {
    const account = useCurrentAccount();
    const router = useRouter();
    const isOwner = account?.address === postedBy;

    const handleApplicantClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/jobs/applicants?id=${id}`);
    };

    // Always go to view page
    const mainLink = `/jobs/view?id=${id}`;

    /* 
       User request: "when the owner... clicks on their job post, they should go to the details of the posting"
       So we revert the direct edit link.
    */

    return (
        <Link href={mainLink} className="block w-full">
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-white/[0.07] group relative">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                {title}
                            </h3>
                            <span className="text-primary font-mono font-bold text-lg md:hidden">
                                {price} SUI
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-zinc-400 mb-3">
                            {location && (
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-500">📍</span>
                                    <span>{location}</span>
                                    {locationRequired && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Required</span>}
                                </div>
                            )}
                            {(durationUnit !== 0 || durationValue > 0) && (
                                <div className="flex items-center gap-1">
                                    <span className="text-zinc-500">⏱️</span>
                                    <span>{getDurationLabel(durationValue, durationUnit)}</span>
                                </div>
                            )}
                        </div>

                        <p className="text-zinc-400 mb-4 line-clamp-2">
                            {description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-zinc-300 border border-white/5"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                            <span>Posted by <span className={isOwner ? "text-primary font-bold" : "text-zinc-300"}>{isOwner ? "You" : postedBy}</span></span>
                            <span>•</span>
                            <span>{postedAt}</span>

                            {isOwner ? (
                                <>
                                    <span>•</span>
                                    <button
                                        onClick={handleApplicantClick}
                                        className="flex items-center gap-1 text-white hover:text-primary transition-colors font-medium bg-white/10 px-2 py-0.5 rounded hover:bg-white/20"
                                    >
                                        👥 {applicantCount} Applicant{applicantCount !== 1 ? 's' : ''}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-zinc-400 font-medium bg-white/5 px-2 py-0.5 rounded">
                                        👥 {applicantCount} Applicant{applicantCount !== 1 ? 's' : ''}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end justify-between gap-4 min-w-[140px]">
                        <span className="hidden md:block text-primary font-mono font-bold text-xl">
                            {price} SUI
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
};
