"use client";

import React, { useState } from 'react';

import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';

export const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-hover opacity-80" />
                    <span className="text-xl font-bold text-white tracking-tight">Origin</span>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/#marketplace" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Marketplace
                    </Link>
                    <Link href="/profile" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Profile
                    </Link>
                    <Link href="/candidates" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Candidates
                    </Link>
                    <Link href="/escrow" className="text-sm font-medium text-zinc-400 hover:text-primary transition-colors">
                        Escrow
                    </Link>
                    <Link href="/dispute" className="text-sm font-medium text-zinc-400 hover:text-primary transition-colors">
                        Dispute
                    </Link>
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden absolute left-1/2 transform -translate-x-1/2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    Menu
                </button>

                <div className="flex items-center gap-4">
                    <ConnectButton className="!bg-primary-transparent !text-primary !border !border-primary/30 hover:!bg-primary/20 !backdrop-blur-sm !font-medium !rounded-lg !px-6 !py-2 !transition-all !duration-200" />
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
                        href="/escrow"
                        className="text-base font-medium text-zinc-400 hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Escrow
                    </Link>
                    <Link
                        href="/dispute"
                        className="text-base font-medium text-zinc-400 hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Dispute
                    </Link>
                </div>
            )}
        </header>
    );
};
