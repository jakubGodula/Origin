"use client";

import React from 'react';

import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';

export const Header: React.FC = () => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
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
                    <Link href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                        Listing
                    </Link>
                    <Link href="#escrow" className="text-sm font-medium text-zinc-400 hover:text-primary transition-colors">
                        Escrow
                    </Link>
                    <Link href="#dispute" className="text-sm font-medium text-zinc-400 hover:text-primary transition-colors">
                        Dispute
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <ConnectButton className="!bg-primary-transparent !text-primary !border !border-primary/30 hover:!bg-primary/20 !backdrop-blur-sm !font-medium !rounded-lg !px-6 !py-2 !transition-all !duration-200" />
                </div>
            </div>
        </header>
    );
};
