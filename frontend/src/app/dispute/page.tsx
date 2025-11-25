"use client";

import React from 'react';
import { Button } from '@/components/Button';

const MOCK_DISPUTES = [
    {
        id: 1,
        jobTitle: "Mobile App Design",
        amount: "800",
        reason: "Deliverables do not match requirements",
        initiator: "Client",
        status: "Open",
        dateOpened: "2024-11-24",
    },
    {
        id: 2,
        jobTitle: "Backend API Integration",
        amount: "1500",
        reason: "Unresponsive freelancer",
        initiator: "Client",
        status: "Resolved",
        dateOpened: "2024-11-10",
    }
];

export default function DisputePage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-5xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Dispute Resolution</h1>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        Fair and transparent dispute resolution mechanism. Submit evidence and let the community or arbitrators decide.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {MOCK_DISPUTES.map((dispute) => (
                        <div key={dispute.id} className="w-full bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-white/[0.07]">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-white">
                                            {dispute.jobTitle}
                                        </h3>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${dispute.status === 'Open' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-green-500/10 text-green-400 border-green-500/20'
                                            }`}>
                                            {dispute.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400 mb-4">
                                        <div className="col-span-2">
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider mb-1">Reason</span>
                                            {dispute.reason}
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider mb-1">Initiated By</span>
                                            {dispute.initiator}
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider mb-1">Amount in Dispute</span>
                                            <span className="text-primary font-mono font-bold">{dispute.amount} SUI</span>
                                        </div>
                                        <div>
                                            <span className="block text-zinc-500 text-xs uppercase tracking-wider mb-1">Date Opened</span>
                                            {dispute.dateOpened}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end justify-center gap-4 min-w-[140px]">
                                    <Button className="w-full" variant="outline">
                                        View Evidence
                                    </Button>
                                    {dispute.status === 'Open' && (
                                        <Button className="w-full">
                                            Respond
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
