"use client";

import React, { useEffect, useState } from 'react';
import { CandidateCard } from '@/components/CandidateCard';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID, CANDIDATE_MODULE } from '@/utils/constants';
import { CandidateProfile } from '@/types/types';

export default function CandidatesPage() {
    const suiClient = useSuiClient();
    const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                // 1. Fetch ProfileCreated events
                const events = await suiClient.queryEvents({
                    query: {
                        MoveModule: {
                            package: PACKAGE_ID,
                            module: CANDIDATE_MODULE,
                        },
                    },
                    limit: 50,
                    order: "descending",
                });

                // Filter for ProfileCreated events
                const profileIds = events.data
                    .filter((event) => event.type.includes("::ProfileCreated"))
                    // @ts-ignore
                    .map((event) => event.parsedJson?.profile_id as string);

                if (profileIds.length === 0) {
                    setCandidates([]);
                    setIsLoading(false);
                    return;
                }

                // 2. Fetch the actual objects
                const objects = await suiClient.multiGetObjects({
                    ids: profileIds,
                    options: { showContent: true },
                });

                const fetchedCandidates: CandidateProfile[] = objects
                    .map((obj) => {
                        if (obj.data?.content?.dataType === 'moveObject') {
                            return obj.data.content.fields as unknown as CandidateProfile;
                        }
                        return null;
                    })
                    .filter((c): c is CandidateProfile => c !== null);

                console.log("Fetched Candidates:", fetchedCandidates);
                const getOptionValue = (option: any) => {
                    if (option === null || option === undefined) return undefined;
                    if (typeof option === 'object') {
                        if ('fields' in option && 'vec' in option.fields) {
                            return option.fields.vec[0];
                        }
                        if ('vec' in option) {
                            return option.vec[0];
                        }
                        // Fallback for empty object or unexpected structure
                        return undefined;
                    }
                    // If it's a primitive (string/number), return it directly
                    return option.toString();
                };

                setCandidates(fetchedCandidates);
            } catch (err: any) {
                console.error("Error fetching candidates:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCandidates();
    }, [suiClient]);

    // Helper to extract option value safely
    const getOptionValue = (option: any) => {
        if (option === null || option === undefined) return undefined;
        if (typeof option === 'object') {
            if ('fields' in option && 'vec' in option.fields) {
                return option.fields.vec[0];
            }
            if ('vec' in option) {
                return option.vec[0];
            }
            return undefined;
        }
        return option.toString();
    };

    return (
        <main className="min-h-screen pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-5xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Top Talent</h1>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        Find the best developers, auditors, and architects for your next big project on Sui.
                    </p>
                </div>

                {isLoading && <div className="text-white">Loading candidates...</div>}
                {error && <div className="text-red-400">Error loading candidates: {error}</div>}

                {!isLoading && !error && candidates.length === 0 && (
                    <div className="text-zinc-400">No candidates found.</div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {candidates.map((candidate) => (
                        <CandidateCard
                            key={candidate.id.id}
                            name={candidate.name}
                            role="Candidate" // We might want to add a 'title' field to the struct later, for now hardcode or use bio snippet
                            rate={candidate.hourly_rate}
                            currency={candidate.preferred_currency}
                            skills={candidate.skills}
                            bio={candidate.bio}
                            imageUrl={candidate.picture_url}
                            emergencyRate={getOptionValue(candidate.emergency_rate)}
                            minimalEngagementTime={getOptionValue(candidate.minimal_engagement_time)}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}
