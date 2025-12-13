"use client";

import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useEscrows, Escrow } from '@/hooks/useEscrows';
import { useJobs } from '@/hooks/useJobs';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { useState } from 'react';
import { getRelativeTime } from '@/utils/format';
import { uploadToWalrus, getWalrusBlobUrl } from '@/utils/walrus';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, ESCROW_MODULE, CLOCK_ID } from '@/utils/constants';
import Link from 'next/link';
import { EmployerDisplay } from '@/components/EmployerDisplay';

// Helper to keep code clean
interface EnrichedEscrow extends Escrow {
    jobTitle: string;
    jobDescription: string;
    jobDeadline: string;
    // Add other job fields if needed
}

export default function DashboardPage() {
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    // Data
    const { data: escrows, isLoading: escrowsLoading, refetch: refetchEscrows } = useEscrows();
    const { data: jobs, isLoading: jobsLoading } = useJobs();

    // State for actions
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const isLoading = escrowsLoading || jobsLoading;

    // Enrich Data
    const myEscrows: EnrichedEscrow[] = (escrows || []).map(escrow => {
        const job = jobs?.find(j => j.id === escrow.job_id);
        return {
            ...escrow,
            jobTitle: job?.title || 'Unknown Job',
            jobDescription: job?.description || 'No description available.',
            jobDeadline: job?.deadline || 'N/A',
        };
    }).filter(e => {
        if (!account) return false;
        return e.employer === account.address || e.freelancer === account.address;
    });

    const hiredJobs = myEscrows.filter(e => e.employer === account?.address);
    const [filterStatus, setFilterStatus] = useState<'active' | 'history'>('active');

    const workingJobs = myEscrows.filter(e => e.freelancer === account?.address)
        .filter(job => {
            if (filterStatus === 'active') {
                return job.status === 'Active' || job.status === 'Delivered';
            }
            return job.status === 'Released' || job.status === 'Disputed'; // History
        });

    // Handlers
    const handleSubmitWork = async (escrow: EnrichedEscrow) => {
        if (!file || !account) return;
        setUploading(true);

        try {
            // TODO: Add SEAL encryption before upload
            // 1. Encrypt file using @mysten/seal with access policy:
            //    - employer and freelancer addresses (always accessible)
            //    - conditional access for admins (only when dispute_active = true)
            // 2. Upload encrypted blob to Walrus
            // For now, uploading unencrypted - see implementation plan for SEAL integration

            // 1. Upload to Walrus
            console.log("Uploading to Walrus...");
            const blobId = await uploadToWalrus(file);
            console.log("Uploaded! Blob ID:", blobId);

            // 2. Submit on-chain
            const tx = new Transaction();

            // mark_delivered(escrow, work_oid, ctx)
            // work_oid is vector<u8>
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
                        console.log("Work submitted successfully!");
                        alert("Work submitted successfully!");
                        setSubmittingId(null);
                        setFile(null);
                        refetchEscrows();
                    },
                    onError: (err) => {
                        console.error("Submission failed:", err);
                        alert("Submission failed on-chain. Please try again.");
                    }
                }
            );

        } catch (err: any) {
            console.error("Error in work submission flow:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (!account) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
                        <p className="text-zinc-400">Please connect your wallet to view your dashboard.</p>
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
                    <h1 className="text-4xl font-bold text-white mb-8">My Active Jobs</h1>

                    {/* Jobs I'm Working On (Freelancer) */}
                    <section className="mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                👨‍💻 Jobs I'm Working On
                                <span className="text-sm font-normal text-zinc-500 ml-2">({workingJobs.length})</span>
                            </h2>
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
                                    onClick={() => setFilterStatus('history')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterStatus === 'history'
                                        ? 'bg-primary text-black shadow-sm'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    History
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-zinc-500">Loading...</div>
                        ) : workingJobs.length === 0 ? (
                            <div className="bg-white/5 rounded-xl p-8 text-center text-zinc-500">
                                You are not working on any jobs yet. Apply to some!
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {workingJobs.map(job => (
                                    <div key={job.id} className="group relative bg-white/5 border border-white/10 rounded-xl p-6 transition-all hover:bg-white/[0.07] hover:border-white/20">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{job.jobTitle}</h3>
                                                <div className="text-sm text-zinc-400 mb-2">
                                                    Employer: <EmployerDisplay address={job.employer} />
                                                </div>
                                                <p className="text-sm text-zinc-300 mb-2 line-clamp-2">{job.jobDescription}</p>
                                                <div className="text-sm text-zinc-400 mb-2">
                                                    Escrow Funding: <span className="text-primary font-mono">{job.amount} SUI</span>
                                                </div>
                                                <div className="text-sm text-zinc-500">
                                                    Due: {job.jobDeadline}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${job.status === 'Active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    job.status === 'Delivered' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                        job.status === 'Released' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                    {job.status}
                                                </div>
                                                <Link href={`/escrow/details?id=${job.id}`} className="text-xs text-zinc-500 hover:text-white underline after:absolute after:inset-0 after:z-0">
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {(job.status === 'Active' || job.status === 'Delivered') && (
                                            <div className="relative z-10 bg-black/20 rounded-lg p-4 mt-4">
                                                <h4 className="text-sm font-bold text-white mb-2">
                                                    {job.status === 'Active' ? 'Submit Work' : 'Update Submission'}
                                                </h4>
                                                <p className="text-xs text-zinc-400 mb-3">
                                                    {job.status === 'Active'
                                                        ? 'Upload your deliverables. This will be stored on Walrus and verified on-chain.'
                                                        : 'Upload new deliverables to replace the previous submission.'}
                                                </p>

                                                <div className="flex gap-4 items-center">
                                                    <input
                                                        type="file"
                                                        className="text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/90"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                setFile(e.target.files[0]);
                                                                setSubmittingId(job.id);
                                                            }
                                                        }}
                                                        disabled={uploading}
                                                    />

                                                    {submittingId === job.id && file && (
                                                        <Button
                                                            onClick={(e) => { e.preventDefault(); handleSubmitWork(job); }}
                                                            disabled={uploading}
                                                        >
                                                            {uploading ? 'Uploading...' : (job.status === 'Active' ? 'Confirm Submission' : 'Confirm Update')}
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Show previous submission link if Delivered */}
                                                {job.status === 'Delivered' && job.work_oid && (
                                                    <div className="mt-3 text-xs text-zinc-500">
                                                        Current Proof: <a href={getWalrusBlobUrl(job.work_oid)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View File</a>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Status Info for Delivered (Cleaned up) */}
                                        {job.status === 'Delivered' && (
                                            <div className="mt-2 text-sm text-zinc-400">
                                                <span className="text-purple-400">✓ Work Delivered.</span> Waiting for employer approval.
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
        </>
    );
}
