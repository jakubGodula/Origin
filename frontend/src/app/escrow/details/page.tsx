"use client";

import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseEscrowFromSuiObject } from '@/hooks/useEscrows';
import { Header } from '@/components/Header';
import { ProfileLink } from '@/components/ProfileLink';
import { getWalrusBlobUrl } from '@/utils/walrus';
import { useJobs } from '@/hooks/useJobs';
import { ArrowLeft, ExternalLink, User, Briefcase, Coins } from 'lucide-react';
import { Suspense } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, ESCROW_MODULE, MARKETPLACE_ID } from '@/utils/constants';
import { uploadToWalrus } from '@/utils/walrus';
import { Button } from '@/components/Button';
import { ReviewSubmissionModal } from '@/components/ReviewSubmissionModal';
import { useState } from 'react';

// Main content component wrapped in Suspense for useSearchParams
function EscrowDetailsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Submission State
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmitWork = async () => {
        if (!file || !escrow) return;

        try {
            setUploading(true);

            // 1. Upload to Walrus
            console.log("Uploading to Walrus...");
            const blobId = await uploadToWalrus(file);
            console.log("Uploaded! Blob ID:", blobId);

            // 2. Submit on-chain
            const tx = new Transaction();

            // mark_delivered(escrow, work_oid, ctx)
            tx.moveCall({
                target: `${PACKAGE_ID}::${ESCROW_MODULE}::mark_delivered`,
                arguments: [
                    tx.object(escrow.id),
                    tx.pure.string(blobId),
                ]
            });

            signAndExecuteTransaction(
                { transaction: tx },
                {
                    onSuccess: async () => {
                        alert("Work submitted successfully!");
                        setFile(null);
                        window.location.reload();
                    },
                    onError: (err) => {
                        console.error("Submission failed:", err);
                        alert("Submission failed on-chain. Please try again.");
                    }
                }
            );

        } catch (err: unknown) {
            console.error("Error in work submission flow:", err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            alert(`Error: ${(err as any).message}`);
        } finally {
            setUploading(false);
        }
    };


    const handleReleaseFunds = () => {
        if (!escrow || !job) return;

        const tx = new Transaction();
        // custom entry fun approve_and_release(escrow: &mut Escrow, marketplace: &Marketplace, ctx: &mut TxContext)
        tx.moveCall({
            target: `${PACKAGE_ID}::${ESCROW_MODULE}::approve_and_release`,
            arguments: [
                tx.object(escrow.id),
                tx.object(escrow.job_id),
                tx.object(MARKETPLACE_ID),
            ]
        });

        signAndExecuteTransaction(
            { transaction: tx },
            {
                onSuccess: async () => {
                    alert("Funds released successfully!");
                    setShowReviewModal(false);
                    // Ideally refetch or reload
                    window.location.reload();
                },
                onError: (err) => {
                    console.error("Release failed:", err);
                    alert("Failed to release funds. See console.");
                }
            }
        );
    };

    const { data: objectData, isLoading: objectLoading, error } = useSuiClientQuery('getObject', {
        id: id || '',
        options: { showContent: true }
    }, {
        enabled: !!id // Only query if ID exists
    });

    // Fetch jobs to enrich data
    const { data: jobs } = useJobs();

    const escrow = objectData ? parseEscrowFromSuiObject(objectData) : null;
    const job = escrow && jobs ? jobs.find(j => j.id === escrow.job_id) : null;

    if (!id) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <div className="text-red-400">No contract ID provided.</div>
            </div>
        );
    }

    if (objectLoading && !escrow) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <div className="text-zinc-500">Loading contract details...</div>
            </div>
        );
    }

    if (error || (!objectLoading && !escrow)) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <div className="text-red-400">Error loading contract. It may not exist.</div>
            </div>
        );
    }

    const handleInitiateDispute = () => {
        if (!escrow || !job) return;
        if (!confirm("Are you sure you want to raise a dispute? This will freeze funds until an admin resolves it.")) return;

        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${ESCROW_MODULE}::initiate_dispute`,
            arguments: [
                tx.object(escrow.id),
            ]
        });

        signAndExecuteTransaction(
            { transaction: tx },
            {
                onSuccess: () => {
                    alert("Dispute initiated successfully.");
                    window.location.reload();
                },
                onError: (err) => {
                    console.error("Dispute initiation failed:", err);
                    alert("Failed to initiate dispute.");
                }
            }
        );
    };

    if (!escrow) return null; // Should be handled above

    return (
        <main className="min-h-screen pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-4xl">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </button>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">

                    {/* Status Header */}
                    <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{job?.title || 'Unknown Job Title'}</h1>
                            <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
                                <span>Contract ID:</span>
                                <span className="text-zinc-500">{escrow.id}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className={`px-4 py-2 rounded-full text-sm font-bold border ${escrow.dispute_active ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                escrow.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    escrow.status === 'Delivered' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        escrow.status === 'Released' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                            'bg-white/10 text-zinc-400 border-white/20'
                                }`}>
                                {escrow.dispute_active ? 'DISPUTE ACTIVE' : escrow.status.toUpperCase()}
                            </div>
                            <span className="text-xs text-zinc-500">Created: {escrow.created_at}</span>
                        </div>
                    </div>

                    {escrow.dispute_active && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
                            <h3 className="text-lg font-bold text-red-400 mb-2">⚠ Dispute in Progress</h3>
                            <p className="text-red-200/80">
                                Funds are currently frozen. An administrator will review the case and resolve the dispute shortly.
                            </p>
                        </div>
                    )}

                    {/* Description & Details */}
                    <div className="mb-8 space-y-6">
                        <section>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" />
                                Description
                            </h3>
                            <div className="bg-white/5 rounded-xl p-4 text-zinc-300 whitespace-pre-wrap">
                                {job?.description || 'No description provided.'}
                            </div>
                        </section>

                        {job?.details && (
                            <section>
                                <h3 className="text-lg font-bold text-white mb-2">Additional Details</h3>
                                <div className="bg-white/5 rounded-xl p-4 text-zinc-300 whitespace-pre-wrap">
                                    {job.details}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                        {/* Financials */}
                        <div className="bg-black/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <Coins className="w-5 h-5 mr-2 text-primary" />
                                Financials
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Escrow Amount</span>
                                    <span className="text-primary font-mono font-bold text-xl">{escrow.amount} SUI</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Platform Fee (Included)</span>
                                    <span className="text-zinc-400">~1%</span>
                                </div>
                            </div>
                        </div>

                        {/* Participants */}
                        <div className="bg-black/20 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-primary" />
                                Participants
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <span className="block text-zinc-500 mb-1">Employer</span>
                                    <ProfileLink
                                        address={escrow.employer}
                                        type="employer"
                                        className="text-blue-400 hover:text-blue-300 font-mono break-all"
                                    >
                                        {escrow.employer === account?.address ? 'You' : escrow.employer}
                                    </ProfileLink>
                                </div>
                                <div>
                                    <span className="block text-zinc-500 mb-1">Freelancer</span>
                                    <ProfileLink
                                        address={escrow.freelancer}
                                        type="candidate"
                                        className="text-purple-400 hover:text-purple-300 font-mono break-all"
                                    >
                                        {escrow.freelancer === account?.address ? 'You' : escrow.freelancer}
                                    </ProfileLink>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Work Submission (Freelancer Only) */}
                    {account?.address === escrow.freelancer && !escrow.released && (escrow.status === 'Active' || escrow.status === 'Delivered') && (
                        <div className="bg-black/20 rounded-xl p-6 mb-8 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-2">
                                {escrow.status === 'Active' ? 'Submit Work' : 'Update Submission'}
                            </h3>
                            <p className="text-zinc-400 text-sm mb-4">
                                {escrow.status === 'Active'
                                    ? 'Upload your deliverables to complete this milestone.'
                                    : 'Upload new deliverables to replace your previous submission.'}
                            </p>

                            <div className="flex gap-4 items-center">
                                <input
                                    type="file"
                                    className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setFile(e.target.files[0]);
                                        }
                                    }}
                                    disabled={uploading}
                                />

                                {file && (
                                    <Button
                                        onClick={(e) => { e.preventDefault(); handleSubmitWork(); }}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : (escrow.status === 'Active' ? 'Confirm Submission' : 'Confirm Update')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Work Deliverables Section (View Only for Employer, or History for Freelancer) */}
                    {(escrow.status === 'Delivered' || escrow.status === 'Released') && (
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                                <Briefcase className="w-5 h-5 mr-2" />
                                Project Deliverables
                            </h3>

                            {escrow.work_oid ? (
                                <>
                                    <p className="text-zinc-300 mb-4">
                                        Work has been submitted and stored on Walrus decentralized storage.
                                    </p>
                                    <a
                                        href={getWalrusBlobUrl(escrow.work_oid)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-medium"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        View Submission
                                    </a>
                                </>
                            ) : (
                                <p className="text-zinc-400 italic mb-2">
                                    No work file link available.
                                </p>
                            )}

                            {/* Review & Release Button (Only for Employer, and not yet released) */}
                            {account?.address === escrow.employer && !escrow.released && (
                                <div className="mt-4 pt-4 border-t border-purple-500/20">
                                    <Button onClick={() => setShowReviewModal(true)}>
                                        Review & Release Payment
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Dispute Actions */}
                    {!escrow.dispute_active && !escrow.released && (escrow.status === 'Active' || escrow.status === 'Delivered') && (
                        <div className="border-t border-white/10 pt-8 mt-8">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-zinc-400">
                                    <p>Having issues?</p>
                                    <p className="text-xs text-zinc-500 mt-1">If you cannot reach an agreement, you can initiate a dispute to freeze funds.</p>
                                </div>
                                <button
                                    onClick={handleInitiateDispute}
                                    className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Raise Dispute
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {escrow && job && (
                <ReviewSubmissionModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onConfirm={handleReleaseFunds}
                    workOid={escrow.work_oid}
                    jobTitle={job.title}
                    amount={escrow.amount} // Note: Formatting might be needed if amount is raw MIST
                />
            )}
        </main>
    );
}

export default function EscrowDetailsPage() {
    return (
        <>
            <Header />
            <Suspense fallback={
                <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                    <div className="text-zinc-500">Loading...</div>
                </div>
            }>
                <EscrowDetailsContent />
            </Suspense>
        </>
    );
}
