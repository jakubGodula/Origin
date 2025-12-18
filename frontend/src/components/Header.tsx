"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton, useSuiClientContext, useCurrentAccount } from '@mysten/dapp-kit';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useIsModerator } from '@/hooks/useIsModerator';
import { useHasPostedJobs } from '@/hooks/useHasPostedJobs';
import { useEscrows } from '@/hooks/useEscrows';
import { ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPlatformMenuOpen, setIsPlatformMenuOpen] = useState(false);
    const platformMenuRef = useRef<HTMLDivElement>(null);
    const ctx = useSuiClientContext();
    const account = useCurrentAccount();
    const { isAdmin } = useIsAdmin();
    const { isSuperAdmin } = useIsSuperAdmin();
    const { isModerator } = useIsModerator();
    const { hasPostedJobs } = useHasPostedJobs();
    const { data: escrows } = useEscrows();

    const isFreelancer = escrows?.some(e => e.freelancer === account?.address);
    const isEmployer = hasPostedJobs || escrows?.some(e => e.employer === account?.address);

    // Escrow is visible to: employers, moderators, or admins
    const showEscrowTab = isEmployer || isModerator || isAdmin || isSuperAdmin;
    const showMyJobsTab = isFreelancer;

    // specific check for disputes involving the user
    // The requirement is "active or past".
    // "Active" = dispute_active is true.
    const hasActiveDispute = escrows?.some(e => e.dispute_active && (e.employer === account?.address || e.freelancer === account?.address));

    // Explicitly: Visible if (User has active dispute) OR (User is Moderator/Admin)
    const showDisputeTab = hasActiveDispute || isModerator || isAdmin || isSuperAdmin;

    // Close platform menu on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (platformMenuRef.current && !platformMenuRef.current.contains(event.target as Node)) {
                setIsPlatformMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">

                {/* Platform Selector */}
                <div className="relative" ref={platformMenuRef}>
                    <button
                        onClick={() => setIsPlatformMenuOpen(!isPlatformMenuOpen)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <NextImage
                            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.png`}
                            alt="Origin Logo"
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                        />
                        <span className="text-xl font-bold text-white tracking-tight">Origin</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isPlatformMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isPlatformMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-xl backdrop-blur-xl py-2 shadow-xl animate-in fade-in z-50">
                            <Link
                                href="/"
                                className="flex items-center px-4 py-3 text-white hover:bg-white/5 transition-colors"
                                onClick={() => setIsPlatformMenuOpen(false)}
                            >
                                <span className="flex-1">Jobs</span>
                                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded ml-2">Current</span>
                            </Link>
                            <div className="px-4 py-3 text-zinc-500 cursor-not-allowed flex items-center justify-between">
                                <span>DEX</span>
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Soon</span>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="hidden md:flex items-center gap-8 px-8">
                    <Link href="/#marketplace" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Marketplace
                    </Link>
                    <Link href="/profile" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Profile
                    </Link>
                    <Link href="/candidates" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Candidates
                    </Link>
                    <Link href="/founders" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Founders
                    </Link>
                    {showMyJobsTab && (
                        <Link href="/my-jobs" className="text-sm font-medium text-zinc-400 hover:text-primary transition-colors">
                            My Jobs
                        </Link>
                    )}
                    {showEscrowTab && (
                        <Link href="/escrow" className="text-sm font-medium text-zinc-400 hover:text-primary transition-colors">
                            Escrow
                        </Link>
                    )}
                    {(showDisputeTab) && (
                        <Link href="/dispute" className="text-sm font-medium text-zinc-400 hover:text-primary transition-colors">
                            Dispute
                        </Link>
                    )}
                    {account && (isAdmin || isSuperAdmin) && (
                        <Link href="/admin" className="text-sm font-medium text-zinc-400 hover:text-primary transition-colors">
                            Admin
                        </Link>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden absolute left-1/2 transform -translate-x-1/2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    Menu
                </button>

                <div className="flex flex-col items-end">
                    <ConnectButton className="!bg-primary-transparent !text-primary !border !border-primary/30 hover:!bg-primary/20 !backdrop-blur-sm !font-medium !rounded-lg !px-6 !py-2 !transition-all !duration-200" />
                    <button
                        onClick={() => ctx.selectNetwork(ctx.network === 'testnet' ? 'devnet' : 'testnet')}
                        className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-primary mt-1 transition-colors"
                    >
                        Switch to {ctx.network === 'testnet' ? 'Devnet' : 'Testnet'}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 py-6 flex flex-col items-center gap-6 animate-in slide-in-from-top-2">
                    <Link
                        href="/#marketplace"
                        className="text-base font-medium text-zinc-400 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Marketplace
                    </Link>
                    <Link
                        href="/profile"
                        className="text-base font-medium text-zinc-400 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Profile
                    </Link>
                    <Link
                        href="/candidates"
                        className="text-base font-medium text-zinc-400 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Candidates
                    </Link>
                    <Link
                        href="/founders"
                        className="text-base font-medium text-zinc-400 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Founders
                    </Link>
                    {showMyJobsTab && (
                        <Link
                            href="/my-jobs"
                            className="text-base font-medium text-zinc-400 hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            My Jobs
                        </Link>
                    )}
                    {showEscrowTab && (
                        <Link
                            href="/escrow"
                            className="text-base font-medium text-zinc-400 hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Escrow
                        </Link>
                    )}
                    {showDisputeTab && (
                        <Link
                            href="/dispute"
                            className="text-base font-medium text-zinc-400 hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Dispute
                        </Link>
                    )}
                    {account && (isAdmin || isSuperAdmin) && (
                        <Link
                            href="/admin"
                            className="text-base font-medium text-zinc-400 hover:text-primary transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Admin
                        </Link>
                    )}
                </div>
            )}
        </header>
    );
};
