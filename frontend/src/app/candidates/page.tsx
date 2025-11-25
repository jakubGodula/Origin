"use client";

import React from 'react';
import { CandidateCard } from '@/components/CandidateCard';

const MOCK_CANDIDATES = [
    {
        id: 1,
        name: "Alex Rivera",
        role: "Senior Smart Contract Engineer",
        rate: "150",
        skills: ["Move", "Rust", "Solidity", "DeFi"],
        bio: "Experienced blockchain developer with a focus on Move and Sui. I have built multiple DeFi protocols and have a deep understanding of smart contract security.",
    },
    {
        id: 2,
        name: "Sarah Chen",
        role: "Full Stack Web3 Developer",
        rate: "120",
        skills: ["React", "Next.js", "TypeScript", "Sui SDK"],
        bio: "Full stack developer specializing in building intuitive dApps. I bridge the gap between complex smart contracts and user-friendly interfaces.",
    },
    {
        id: 3,
        name: "Michael O'Connor",
        role: "Blockchain Architect",
        rate: "200",
        skills: ["System Design", "Cryptography", "Move", "Zero Knowledge"],
        bio: "Architecting scalable and secure blockchain solutions. Passionate about privacy and zero-knowledge proofs.",
    },
    {
        id: 4,
        name: "Emily Zhang",
        role: "Smart Contract Auditor",
        rate: "180",
        skills: ["Security Auditing", "Move", "Formal Verification"],
        bio: "Ensuring the safety of your funds through rigorous smart contract auditing and formal verification.",
    }
];

export default function CandidatesPage() {
    return (
        <main className="min-h-screen pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-5xl">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Top Talent</h1>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        Find the best developers, auditors, and architects for your next big project on Sui.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {MOCK_CANDIDATES.map((candidate) => (
                        <CandidateCard
                            key={candidate.id}
                            name={candidate.name}
                            role={candidate.role}
                            rate={candidate.rate}
                            skills={candidate.skills}
                            bio={candidate.bio}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}
