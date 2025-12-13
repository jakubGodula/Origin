"use client";

import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useEscrows, Escrow } from '@/hooks/useEscrows';
import { useJobs } from '@/hooks/useJobs';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { getWalrusBlobUrl } from '@/utils/walrus';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, ESCROW_MODULE, MARKETPLACE_ID } from '@/utils/constants';
import Link from 'next/link';

import { ReviewSubmissionModal } from '@/components/ReviewSubmissionModal';
import { FreelancerDisplay } from '@/components/FreelancerDisplay';
import { useState } from 'react';

// Helper to keep code clean
interface EnrichedEscrow extends Escrow {
    jobTitle: string;
    jobDescription: string;
    jobDeadline: string;
    // ...
}

export default function EscrowPage() {
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [activeReviewJob, setActiveReviewJob] = useState<EnrichedEscrow | null>(null);

    // Data
    const { data: escrows, isLoading: escrowsLoading, refetch: refetchEscrows } = useEscrows();
    const { data: jobs, isLoading: jobsLoading } = useJobs();

    const isLoading = escrowsLoading || jobsLoading;

    const [filterStatus, setFilterStatus] = useState<'all' | 'active'>('active');

    // Filter for Employer
    const hiredJobs = (escrows || []).map(escrow => {
        const job = jobs?.find(j => j.id === escrow.job_id);
        return {
            ...escrow,
            jobTitle: job?.title || 'Unknown Job',
            jobDescription: job?.description || 'No description available.',
            jobDeadline: job?.deadline || 'N/A',
        };
    }).filter(e => e.employer === account?.address)
        .filter(escrow => {
            if (filterStatus === 'active') {
                return !escrow.released;
            }
            return true;
        });

    // Handlers
    const handleReleaseFunds = (escrow: EnrichedEscrow) => {
        const tx = new Transaction();
        // custom entry fun approve_and_release(escrow: &mut Escrow, marketplace: &Marketplace, ctx: &mut TxContext)
        tx.moveCall({
            target: `${PACKAGE_ID}::${ESCROW_MODULE}::approve_and_release`,
            arguments: [
                tx.object(escrow.id),
                tx.object(escrow.job_id), // Changed: Pass Job Object ID
                tx.object(MARKETPLACE_ID),
            ]
        });

        signAndExecuteTransaction(
            { transaction: tx },
            {
                onSuccess: async () => {
                    alert("Funds released successfully!");
                    refetchEscrows();
                },
                onError: (err) => {
                    console.error("Release failed:", err);
                    alert("Failed to release funds. See console.");
                }
            }
        );
    };

    if (!account) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Escrow Management</h1>
                        <p className="text-zinc-400">Please connect your wallet.</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-12 px-6">
                <div className="container mx-auto max-w-5xl">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold text-white mb-4">Escrow Management</h1>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-zinc-400">
                                Manage your active contracts and release payments securely.
                            </p>
                        </div>
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => setFilterStatus('active')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'active'
                                    ? 'bg-primary text-black shadow-sm'
                                    : 'text-zinc-400 hover:text-white'
                                    }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'all'
                                    ? 'bg-primary text-black shadow-sm'
                                    : 'text-zinc-400 hover:text-white'
                                    }`}
                            >
                                History (All)
                            </button>
                        </div>
                    </div>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            Active & Past Contracts
                            <span className="text-sm font-normal text-zinc-500 ml-2">({hiredJobs.length})</span>
                        </h2>

                        {isLoading ? (
                            <div className="text-zinc-500">Loading...</div>
                        ) : hiredJobs.length === 0 ? (
                            <div className="bg-white/5 rounded-xl p-8 text-center text-zinc-500">
                                No contracts found.
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {hiredJobs.map(job => (
                                    <div key={job.id} className="group relative bg-white/5 border border-white/10 rounded-xl p-6 transition-all hover:bg-white/[0.07] hover:border-white/20">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{job.jobTitle}</h3>
                                                <div className="text-sm text-zinc-400">
                                                    Freelancer: <FreelancerDisplay address={job.freelancer} />
                                                </div>
                                                <p className="text-sm text-zinc-300 mt-2 line-clamp-2">{job.jobDescription}</p>
                                                <div className="text-sm text-zinc-400 mt-2">
                                                    Amount: <span className="text-primary font-mono">{job.amount} SUI</span>
                                                </div>
                                                <div className="text-sm text-zinc-500 mt-1">
                                                    Due: {job.jobDeadline}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    job.status === 'Delivered' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        'bg-green-500/10 text-green-400 border-green-500/20'
                                                    }`}>
                                                    {job.status}
                                                </div>
                                                <Link href={`/escrow/details?id=${job.id}`} className="text-xs text-zinc-500 hover:text-white underline after:absolute after:inset-0 after:z-0">
                                                </Link>
                                            </div>
                                        </div>

                                        {job.status === 'Delivered' && (
                                            <div className="relative z-10 mt-4 bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
                                                <h4 className="text-sm font-bold text-purple-300 mb-2">Action Required: Work Delivered</h4>
                                                <p className="text-xs text-purple-200/70 mb-3">
                                                    The freelancer has submitted their work. Please review it and release payment if satisfied.
                                                </p>
                                                {job.work_oid && (
                                                    <>
                                                        {/* TODO: Add SEAL decryption for authorized viewing
                                                            - Check if current user is authorized (employer, freelancer, or admin during dispute)
                                                            - Decrypt blob using @mysten/seal before displaying
                                                            - Show appropriate error if user is not authorized
                                                            For now, showing unencrypted Walrus blob URL */}
                                                        <a
                                                            href={getWalrusBlobUrl(job.work_oid)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline text-sm block mb-4"
                                                        >
                                                            View Submission (Walrus Blob) ↗
                                                        </a>
                                                    </>
                                                )}
                                                <Button onClick={(e) => { e.preventDefault(); setActiveReviewJob(job); }}>
                                                    Review & Release Payment
                                                </Button>
                                            </div>
                                        )}

                                        {job.status === 'Released' && (
                                            <div className="mt-4 text-sm text-green-400 font-medium flex items-center gap-2">
                                                <span>✓ Payment Released</span>
                                                <span className="text-zinc-500 font-normal">- Job Complete</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {activeReviewJob && (
                <ReviewSubmissionModal
                    isOpen={!!activeReviewJob}
                    onClose={() => setActiveReviewJob(null)}
                    onConfirm={() => {
                        if (activeReviewJob) {
                            handleReleaseFunds(activeReviewJob);
                            setActiveReviewJob(null);
                        }
                    }}
                    workOid={activeReviewJob.work_oid}
                    jobTitle={activeReviewJob.jobTitle}
                    amount={activeReviewJob.amount}
                />
            )}
        </>
    );
}
