"use client";

import React from 'react';
import { Button } from '@/components/Button';

const MOCK_ESCROWS = [
    {
        id: 1,
        jobTitle: "Smart Contract Audit",
        amount: "500",
        client: "DeFi Protocol X",
        freelancer: "Alex Rivera",
        status: "Funded",
        dueDate: "2024-12-01",
    },
    {
        id: 2,
        jobTitle: "Frontend Development",
        amount: "1200",
        client: "NFT Marketplace Y",
        freelancer: "Sarah Chen",
        status: "Released",
        dueDate: "2024-11-20",
    },
    {
        id: 3,
        jobTitle: "Zero Knowledge Proof Implementation",
        amount: "2500",
        client: "Privacy DAO",
        freelancer: "Michael O'Connor",
        status: "Funded",
        dueDate: "2024-12-15",
    }
];

export default function EscrowPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-5xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Escrow Management</h1>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        Securely manage your funds and milestones. Funds are held in smart contracts until work is verified.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {MOCK_ESCROWS.map((escrow) => (
                        <div key={escrow.id} className="w-full bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-white/[0.07]">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-white">
                                            {escrow.jobTitle}
                                        </h3>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${escrow.status === 'Funded' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                escrow.status === 'Released' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                            }`}>
                                            {escrow.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400 mb-4">
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider mb-1">Client</span>
                                            {escrow.client}
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider mb-1">Freelancer</span>
                                            {escrow.freelancer}
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider mb-1">Amount</span>
                                            <span className="text-primary font-mono font-bold">{escrow.amount} SUI</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider mb-1">Due Date</span>
                                            {escrow.dueDate}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end justify-center gap-4 min-w-[140px]">
                                    <Button className="w-full" variant="outline">
                                        View Contract
                                    </Button>
                                    {escrow.status === 'Funded' && (
                                        <Button className="w-full">
                                            Release Funds
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
