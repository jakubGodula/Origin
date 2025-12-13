"use client";

import React, { useEffect, useState } from 'react';
import { CandidateCard } from '@/components/CandidateCard';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID, CANDIDATE_MODULE, REPUTATION_PROFILE_TYPE } from '@/utils/constants';
import { CandidateProfile, ReputationProfile } from '@/types/types';
import Link from 'next/link';

export default function CandidatesPage() {
    const suiClient = useSuiClient();
    const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
    const [reputationProfiles, setReputationProfiles] = useState<Record<string, ReputationProfile>>({});
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

                // 3. Fetch Reputation Profiles for each candidate
                const reputationMap: Record<string, ReputationProfile> = {};
                await Promise.all(fetchedCandidates.map(async (candidate) => {
                    try {
                        const repObjects = await suiClient.getOwnedObjects({
                            owner: candidate.owner,
                            filter: { StructType: REPUTATION_PROFILE_TYPE },
                            options: { showContent: true }
                        });

                        if (repObjects.data && repObjects.data.length > 0) {
                            // Assuming one profile per user for now
                            const repObj = repObjects.data[0];
                            if (repObj.data?.content?.dataType === 'moveObject') {
                                reputationMap[candidate.owner] = repObj.data.content.fields as unknown as ReputationProfile;
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to fetch reputation for ${candidate.owner}`, e);
                    }
                }));
                setReputationProfiles(reputationMap);

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

    // Helper to get skill rating
    const getSkillRating = (owner: string, skillName: string) => {
        const profile = reputationProfiles[owner];
        if (!profile || !profile.skill_scores || !profile.skill_counts) return { rating: 0, count: 0 };

        // VecMap structure: contents: [{key, value}]
        const scores = profile.skill_scores.fields.contents;
        const counts = profile.skill_counts.fields.contents;

        const scoreEntry = scores.find((s: any) => s.key === skillName);
        const countEntry = counts.find((c: any) => c.key === skillName);

        if (!scoreEntry || !countEntry) return { rating: 0, count: 0 };

        const totalScore = Number(scoreEntry.value);
        const count = Number(countEntry.value);

        if (count === 0) return { rating: 0, count: 0 };

        return {
            rating: totalScore / count, // Score matches Move (total / count) but frontend can display decimal if backend stored higher precision. Move stores integer? 
            // rate_skill adds score (1-5). average is (total * 100) / count. So it is percentage * 5? No, Move average is scaled by 100.
            // Wait, re-checking `reputation.move`:
            // `(total_rating * 100) / rating_count` -> e.g. 5 * 100 / 1 = 500. 
            // So if I have total 5 and count 1, stored/calculated avg is 500.
            // But here I'm reading raw total sum and count.
            // So average = total / count. E.g. 5/1 = 5. 
            // If Move stores `total` as sum of ratings (1-5), then simple division is enough.
            count
        };
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
                        <Link
                            key={candidate.id.id}
                            href={`/profile/view?id=${candidate.id.id}`}
                            className="block"
                        >
                            <CandidateCard
                                name={candidate.name}
                                role="Candidate" // We might want to add a 'title' field to the struct later, for now hardcode or use bio snippet
                                rate={candidate.hourly_rate}
                                currency={candidate.preferred_currency}
                                skills={candidate.skills.map(skill => {
                                    const { rating, count } = getSkillRating(candidate.owner, skill);
                                    return { name: skill, rating, count };
                                })}
                                bio={candidate.bio}
                                imageUrl={candidate.picture_url}
                                emergencyRate={getOptionValue(candidate.emergency_rate)}
                                minimalEngagementTime={getOptionValue(candidate.minimal_engagement_time)}
                                locationPrivate={candidate.location_private}
                                nationalities={candidate.nationalities}
                                nationalitiesPrivate={candidate.nationalities_private}
                                education={(() => {
                                    // @ts-ignore - Handle raw Move object structure
                                    const firstEdu = candidate.education?.[0]?.fields;
                                    if (firstEdu) {
                                        return `${firstEdu.degree} @ ${firstEdu.institution}`;
                                        // or "MSc in CS at MIT" - let's stick to "Degree @ Institution" or "Degree at Institution"
                                    }
                                    return undefined;
                                })()}
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
