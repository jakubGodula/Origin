"use client";

import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { useEscrows, Escrow } from '@/hooks/useEscrows';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useState } from 'react';
import { PACKAGE_ID, ESCROW_MODULE, MARKETPLACE_ID } from '@/utils/constants';
import { Transaction } from '@mysten/sui/transactions';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Scale, Shield, Filter } from 'lucide-react';

// Unified Dispute Resolution Page
export default function DisputePage() {
    const account = useCurrentAccount();
    const router = useRouter();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

    // Roles
    const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();

    // Data
    const { data: escrows, isLoading: isEscrowsLoading, refetch } = useEscrows();

    // UI filters
    const [showResolved, setShowResolved] = useState(false);

    // Filtering Logic
    const displayedEscrows = (escrows || []).filter(e => {
        // 1. Role Constraints
        if (!isAdmin) {
            const isParticipant = e.employer === account?.address || e.freelancer === account?.address;
            if (!isParticipant) return false;
        }

        // 2. Status Constraints (Active/Resolved)
        // If "Show Resolved" is ON, we show everything that passes role check (Active + Resolved)
        // If "Show Resolved" is OFF, we show ONLY `dispute_active == true`.
        if (showResolved) {
            return true; // Show all history
        } else {
            return e.dispute_active; // Show only currently active disputes
        }
    });

    // Resolution State
    const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
    const [resolutionType, setResolutionType] = useState<'freelancer_win' | 'employer_win' | 'split'>('split');
    const [freelancerSplitBps, setFreelancerSplitBps] = useState<number>(5000); // 5000 bps = 50%

    // Derived values for UI
    const totalAmount = selectedEscrow ? parseFloat(selectedEscrow.amount) : 0;
    const estimatedNet = totalAmount * 0.99;
    const freelancerAmount = (estimatedNet * freelancerSplitBps) / 10000;
    const employerAmount = estimatedNet - freelancerAmount;

    // Handlers
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFreelancerSplitBps(Number(e.target.value));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'freelancer' | 'employer') => {
        if (!selectedEscrow) return;
        const val = parseFloat(e.target.value);
        if (isNaN(val)) return;

        let newBps = 0;
        if (side === 'freelancer') {
            newBps = (val / estimatedNet) * 10000;
        } else {
            const freelancerAmt = estimatedNet - val;
            newBps = (freelancerAmt / estimatedNet) * 10000;
        }
        newBps = Math.max(0, Math.min(10000, newBps));
        setFreelancerSplitBps(Math.round(newBps));
    };

    const handleResolve = () => {
        if (!selectedEscrow) return;
        if (!confirm("Confirm resolution? This action is irreversible.")) return;

        const tx = new Transaction();

        if (resolutionType === 'split') {
            tx.moveCall({
                target: `${PACKAGE_ID}::${ESCROW_MODULE}::resolve_dispute_split`,
                arguments: [
                    tx.object(selectedEscrow.id),
                    tx.object(MARKETPLACE_ID),
                    tx.pure.u64(freelancerSplitBps),
                ]
            });
        } else {
            const winnerIsFreelancer = resolutionType === 'freelancer_win';
            tx.moveCall({
                target: `${PACKAGE_ID}::${ESCROW_MODULE}::resolve_dispute`,
                arguments: [
                    tx.object(selectedEscrow.id),
                    tx.object(MARKETPLACE_ID),
                    tx.pure.bool(winnerIsFreelancer),
                ]
            });
        }

        signAndExecuteTransaction(
            { transaction: tx },
            {
                onSuccess: () => {
                    alert("Dispute resolved successfully!");
                    setSelectedEscrow(null);
                    refetch();
                },
                onError: (err) => {
                    console.error("Resolution failed:", err);
                    alert("Resolution failed. See console.");
                }
            }
        );
    };

    if (!account) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                    <p className="text-zinc-400">Please connect your wallet.</p>
                </div>
            </>
        );
    }

    if (isAdminLoading || isEscrowsLoading) {
        return (
            <>
                <Header />
                <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                    <p className="text-zinc-500">Loading disputes...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-12 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-3">
                            <Shield className="w-8 h-8 text-primary" />
                            <h1 className="text-3xl font-bold text-white">Dispute Center</h1>
                        </div>

                        {/* Resolve Toggle */}
                        <label className="flex items-center space-x-2 cursor-pointer bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                            <input
                                type="checkbox"
                                checked={showResolved}
                                onChange={(e) => setShowResolved(e.target.checked)}
                                className="form-checkbox text-primary rounded bg-black/20 border-white/20"
                            />
                            <span className="text-sm text-zinc-400">Show Resolved / History</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* List of Disputes */}
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-xl font-bold text-white mb-4">
                                {showResolved ? 'All Records' : 'Active Disputes'} ({displayedEscrows.length})
                            </h2>

                            {displayedEscrows.length === 0 ? (
                                <div className="text-zinc-500 bg-white/5 p-6 rounded-xl border border-white/5 text-center py-12">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    No records found.
                                </div>
                            ) : (
                                displayedEscrows.map(escrow => (
                                    <div
                                        key={escrow.id}
                                        onClick={() => setSelectedEscrow(escrow)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedEscrow?.id === escrow.id
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-xs text-zinc-500 truncate w-20">{escrow.id}</span>
                                            {escrow.dispute_active ? (
                                                <span className="text-xs text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">ACTIVE</span>
                                            ) : (
                                                <span className="text-xs text-zinc-400 font-bold bg-white/10 px-2 py-0.5 rounded">{escrow.status.toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-bold">{escrow.amount} SUI</span>
                                            <span className="text-xs text-zinc-400">{escrow.created_at}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Detail / Resolution Area */}
                        <div className="lg:col-span-2">
                            {selectedEscrow ? (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                    <div className="mb-6 pb-6 border-b border-white/10">
                                        <h2 className="text-2xl font-bold text-white mb-2">Details</h2>
                                        <div className="flex gap-8 text-sm text-zinc-400 flex-wrap">
                                            <p>Contract: <Link href={`/escrow/details?id=${selectedEscrow.id}`} className="text-primary hover:underline">{selectedEscrow.id}</Link></p>
                                            <p>Total Funds: <span className="text-white font-mono">{selectedEscrow.amount} SUI</span></p>
                                            <p>Status: <span className={selectedEscrow.dispute_active ? "text-red-400" : "text-green-400"}>{selectedEscrow.dispute_active ? "Active Dispute" : selectedEscrow.status}</span></p>
                                        </div>
                                    </div>

                                    {/* Resolution Controls - Only for Admin & Active Dispute */
                                        (isAdmin && selectedEscrow.dispute_active) ? (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl mb-6">
                                                    <h3 className="text-primary font-bold flex items-center gap-2">
                                                        <Scale className="w-4 h-4" />
                                                        Admin Action Required
                                                    </h3>
                                                    <p className="text-sm text-zinc-400 mt-1">Select a resolution method below to resolve this dispute.</p>
                                                </div>

                                                {/* Method Selection */}
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-4">Resolution Method</label>
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => { setResolutionType('freelancer_win'); setFreelancerSplitBps(10000); }}
                                                            className={`flex-1 p-4 rounded-xl border transition-all ${resolutionType === 'freelancer_win' ? 'bg-purple-500/20 border-purple-400 text-purple-100' : 'bg-black/20 border-transparent text-zinc-500 hover:bg-white/5'}`}
                                                        >
                                                            Freelancer Wins (100%)
                                                        </button>
                                                        <button
                                                            onClick={() => { setResolutionType('employer_win'); setFreelancerSplitBps(0); }}
                                                            className={`flex-1 p-4 rounded-xl border transition-all ${resolutionType === 'employer_win' ? 'bg-blue-500/20 border-blue-400 text-blue-100' : 'bg-black/20 border-transparent text-zinc-500 hover:bg-white/5'}`}
                                                        >
                                                            Employer Wins (100%)
                                                        </button>
                                                        <button
                                                            onClick={() => { setResolutionType('split'); setFreelancerSplitBps(5000); }}
                                                            className={`flex-1 p-4 rounded-xl border transition-all ${resolutionType === 'split' ? 'bg-amber-500/20 border-amber-400 text-amber-100' : 'bg-black/20 border-transparent text-zinc-500 hover:bg-white/5'}`}
                                                        >
                                                            Negotiated Split
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Split Logic UI */}
                                                {resolutionType === 'split' && (
                                                    <div className="bg-black/20 rounded-xl p-6 border border-white/5 space-y-6">
                                                        <div className="flex justify-between items-center text-sm font-medium text-zinc-400">
                                                            <span>Employer Share</span>
                                                            <span>Freelancer Share</span>
                                                        </div>

                                                        <div className="relative h-2 bg-gradient-to-r from-blue-500 via-zinc-600 to-purple-500 rounded-full">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="10000"
                                                                value={freelancerSplitBps}
                                                                onChange={handleSliderChange}
                                                                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                                            />
                                                            <div
                                                                className="absolute top-1/2 -mt-2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 transition-all pointer-events-none"
                                                                style={{ left: `${freelancerSplitBps / 100}%` }}
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-8">
                                                            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                                                                <label className="block text-xs text-blue-300 mb-1">Employer Receives</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        value={employerAmount.toFixed(2)}
                                                                        onChange={(e) => handleAmountChange(e, 'employer')}
                                                                        className="w-full bg-transparent text-xl font-bold text-white border-none focus:ring-0 p-0"
                                                                    />
                                                                    <span className="text-sm text-blue-400">SUI</span>
                                                                </div>
                                                                <div className="text-xs text-blue-400/50 mt-1">{(100 - (freelancerSplitBps / 100)).toFixed(1)}%</div>
                                                            </div>

                                                            <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20 text-right">
                                                                <label className="block text-xs text-purple-300 mb-1">Freelancer Receives</label>
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <input
                                                                        type="number"
                                                                        step="0.1"
                                                                        value={freelancerAmount.toFixed(2)}
                                                                        onChange={(e) => handleAmountChange(e, 'freelancer')}
                                                                        className="w-full bg-transparent text-xl font-bold text-white border-none focus:ring-0 p-0 text-right"
                                                                    />
                                                                    <span className="text-sm text-purple-400">SUI</span>
                                                                </div>
                                                                <div className="text-xs text-purple-400/50 mt-1">{(freelancerSplitBps / 100).toFixed(1)}%</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <Button onClick={handleResolve} className="w-full py-4 text-lg font-bold bg-primary text-black hover:bg-primary/90">
                                                    <Scale className="w-5 h-5 mr-2" />
                                                    Execute Resolution
                                                </Button>

                                            </div>
                                        ) : (
                                            // User View / Non-Active
                                            <div className="p-8 bg-black/20 rounded-xl text-center">
                                                {selectedEscrow.dispute_active ? (
                                                    <>
                                                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                                        <h3 className="text-xl font-bold text-white mb-2">Dispute in Progress</h3>
                                                        <p className="text-zinc-400 mb-4">Currently awaiting administrative review. Funds are frozen.</p>
                                                        <p className="text-sm text-zinc-500">Admins will review the evidence and resolve the contract shortly.</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                                        <h3 className="text-xl font-bold text-white mb-2">Resolved / Inactive</h3>
                                                        <p className="text-zinc-400">This contract is not currently under dispute.</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <div className="h-full bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-zinc-500">
                                    <Shield className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Select a dispute from the list to view details.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
