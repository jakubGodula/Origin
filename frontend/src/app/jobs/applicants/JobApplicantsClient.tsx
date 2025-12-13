"use client";

import React from 'react';
import { Header } from '@/components/Header';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { useRouter, useSearchParams } from 'next/navigation';
import { PACKAGE_ID, MODULE_NAME, CANDIDATE_PROFILE_TYPE, MARKETPLACE_ID, ESCROW_MODULE } from '@/utils/constants';
import { CandidateProfile } from '@/types/types';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import Link from 'next/link';
import { getRelativeTime } from '@/utils/format';
import { useJobs } from '@/hooks/useJobs';

interface SelectedApplicant {
    address: string;
    profileId: string | null;
    price: string; // MIST
    proposal: string;
}

export function JobApplicantsClient() {
    // Switch to searchParams
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const account = useCurrentAccount();
    const router = useRouter();
    const { data: jobs } = useJobs();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    const [isMounted, setIsMounted] = React.useState(false);
    const [selectedApplicant, setSelectedApplicant] = React.useState<SelectedApplicant | null>(null);

    React.useEffect(() => setIsMounted(true), []);

    const job = jobs?.find(j => j.id === id);

    const { data: employerProfiles } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: { StructType: `${PACKAGE_ID}::employer::EmployerProfile` },
            options: { showContent: true }
        },
        { enabled: !!account }
    );

    const employerProfileId = React.useMemo(() => {
        if (!employerProfiles?.data || employerProfiles.data.length === 0) return null;
        return employerProfiles.data[0].data?.objectId;
    }, [employerProfiles]);

    const { data: applicationsData, isLoading: isLoadingApps } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::JobApplication` },
            options: { showContent: true }
        },
        { enabled: !!account }
    );

    const jobApplications = (applicationsData?.data || [])
        .map(obj => {
            if (obj.data?.content?.dataType === 'moveObject') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return obj.data.content.fields as any;
            }
            return null;
        })
        .filter(app => {
            if (!app || app.job_id !== id) return false;
            // Filter by version if job is loaded
            if (job && app.job_version !== undefined) {
                return Number(app.job_version) === job.job_version;
            }
            return true;
        });

    const handleHireClick = (applicantAddress: string, price: string, proposal: string, profileId: string | null) => {
        if (!account || !id) return;
        setSelectedApplicant({
            address: applicantAddress,
            profileId,
            price: price,
            proposal: proposal
        });
    };

    const confirmHire = () => {
        if (!selectedApplicant || !account || !id) return;

        if (!employerProfileId) {
            alert("No Employer Profile found. Please create one to hire freelancers.");
            return;
        }

        const tx = new Transaction();

        // 1. Mark freelancer as selected
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::select_freelancer`,
            arguments: [
                tx.object(id),
                tx.pure.address(selectedApplicant.address),
            ],
        });

        // 2. Split coins for escrow
        // Ensure we have enough balance (wallet handles this check usually, but good to be aware)
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(selectedApplicant.price)]);

        // 3. Create Escrow
        tx.moveCall({
            target: `${PACKAGE_ID}::${ESCROW_MODULE}::create_escrow`,
            typeArguments: [`${PACKAGE_ID}::${MODULE_NAME}::Listing`],
            arguments: [
                tx.object(MARKETPLACE_ID),
                tx.object(employerProfileId as string), // Employer Profile ID (Enforced)
                tx.object(id),
                tx.pure.address(account.address), // employer address
                tx.pure.address(selectedApplicant.address), // freelancer address
                coin,
                tx.object('0x6'), // Clock object
            ]
        });

        signAndExecuteTransaction({
            transaction: tx,
        }, {
            onSuccess: () => {
                alert('Freelancer hired and funds locked in escrow successfully!');
                setSelectedApplicant(null);
                router.push('/jobs/view?id=' + id);
            },
            onError: (error) => {
                console.error('Failed to hire freelancer:', error);
                alert('Failed to hire freelancer. See console for details.');
                setSelectedApplicant(null);
            }
        });
    };

    if (!isMounted) return null;
    if (!id) return <div className="text-white text-center pt-24">Invalid Job ID</div>;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header />
            <main className="pt-24 pb-12 px-6 container mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        ← Back
                    </button>
                    <h1 className="text-3xl font-bold text-white">
                        Job Applicants ({jobApplications.length})
                    </h1>
                </div>

                {isLoadingApps ? (
                    <div className="text-zinc-400">Loading applications...</div>
                ) : jobApplications.length === 0 ? (
                    <div className="text-zinc-400 bg-white/5 p-8 rounded-xl border border-white/10 text-center">
                        No applicants yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobApplications.map((app) => (
                            <ApplicantCard
                                key={app.id.id}
                                applicantAddress={app.applicant}
                                proposal={app.proposal}
                                price={app.proposed_price}
                                appliedAt={app.applied_at}
                                estimatedDuration={app.estimated_delivery}
                                onHire={(profileId) => handleHireClick(app.applicant, app.proposed_price, app.proposal, profileId)}
                                canHire={job?.status === 0} // Only allow hire if job is OPEN
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Hire Confirmation Modal */}
            {selectedApplicant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">Confirm Hire</h2>

                        <div className="space-y-4 mb-6">
                            <p className="text-zinc-300">
                                You are about to hire this freelancer. Funds will be locked in escrow.
                            </p>

                            <div className="bg-white/5 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Freelancer:</span>
                                    <span className="text-white font-mono text-sm max-w-[200px] truncate" title={selectedApplicant.profileId || selectedApplicant.address}>
                                        {selectedApplicant.profileId ? (
                                            <>NFT ID: {selectedApplicant.profileId}</>
                                        ) : (
                                            <>{selectedApplicant.address.slice(0, 6)}...{selectedApplicant.address.slice(-4)}</>
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Price:</span>
                                    <span className="text-primary font-bold">
                                        {Number(selectedApplicant.price) / 1_000_000_000} SUI
                                    </span>
                                </div>
                                {job && (Number(selectedApplicant.price) / 1_000_000_000) > Number(job.price) && (
                                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-500 text-sm">
                                        ⚠️ <strong>Warning:</strong> This offer ({Number(selectedApplicant.price) / 1_000_000_000} SUI)
                                        exceeds your job budget of {job.price} SUI.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedApplicant(null)}
                                className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmHire}
                                className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-black font-bold transition-colors"
                            >
                                Confirm & Hire
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ApplicantCard({ applicantAddress, proposal, price, appliedAt, estimatedDuration, onHire, canHire }: {
    applicantAddress: string,
    proposal: string,
    price: string,
    appliedAt: string,
    estimatedDuration?: string,
    onHire: (profileId: string | null) => void,
    canHire: boolean
}) {
    const { data: profileData, isLoading } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: applicantAddress,
            filter: { StructType: CANDIDATE_PROFILE_TYPE },
            options: { showContent: true }
        }
    );

    const profile = profileData?.data?.[0]?.data?.content?.dataType === 'moveObject'
        ? (profileData.data[0].data.content.fields as unknown as CandidateProfile)
        : null;

    const profileId = profileData?.data?.[0]?.data?.objectId ?? null;

    // Calculate days from ms string
    const durationDays = estimatedDuration ? Math.ceil(Number(estimatedDuration) / (1000 * 60 * 60 * 24)) : 0;

    if (isLoading) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-white/10" />
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-white/10 rounded" />
                        <div className="h-3 w-48 bg-white/5 rounded" />
                    </div>
                </div>
                <div className="space-y-2 mt-4">
                    <div className="h-3 w-full bg-white/5 rounded" />
                    <div className="h-3 w-2/3 bg-white/5 rounded" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-zinc-400 mb-2">Address: {applicantAddress.slice(0, 6)}...{applicantAddress.slice(-4)}</div>
                <div className="text-sm text-zinc-500">Profile not found</div>
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-sm text-zinc-400"><strong>Proposal:</strong> {proposal}</div>
                    <div className="text-sm text-primary mt-1"><strong>Offer:</strong> {Number(price) / 1000000000} SUI</div>
                    {durationDays > 0 && (
                        <div className="text-sm text-zinc-300 mt-1"><strong>Delivery:</strong> {durationDays} Days</div>
                    )}

                    {/* Allow accepting proposal even if profile load fails (fallback) */}
                    {canHire && (
                        <button
                            onClick={() => onHire(null)}
                            className="w-full mt-4 bg-primary text-black font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Accept Proposal
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-4 mb-4">
                <Link href={`/profile/view?address=${applicantAddress}`} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden group-hover:ring-2 ring-primary transition-all">
                        {profile.picture_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.picture_url} className="w-full h-full object-cover" alt={profile.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">👤</div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors">{profile.name}</h3>
                        <p className="text-sm text-zinc-400">{profile.bio?.slice(0, 50)}...</p>
                    </div>
                </Link>
            </div>

            <div className="space-y-2 text-sm text-zinc-300">
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                    <span>Applied {getRelativeTime(Number(appliedAt))}</span>
                </div>
                <div className="flex justify-between">
                    <span>Skills:</span>
                    <span className="text-white">{profile.skills.slice(0, 3).join(", ")}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="mb-2"><strong className="text-zinc-500">Proposal:</strong> <p className="mt-1 italic text-zinc-300">&quot;{proposal}&quot;</p></div>

                    <div className="bg-black/20 p-3 rounded space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-zinc-400">Offer:</span>
                            <span className="text-primary font-mono font-bold">{Number(price) / 1000000000} SUI</span>
                        </div>
                        {durationDays > 0 && (
                            <div className="flex justify-between items-center px-1">
                                <span className="text-zinc-400">Delivery:</span>
                                <span className="text-white font-medium">{durationDays} Days</span>
                            </div>
                        )}
                    </div>

                    {canHire && (
                        <button
                            onClick={() => onHire(profileId)}
                            className="w-full mt-4 bg-primary text-black font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Accept Proposal
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
