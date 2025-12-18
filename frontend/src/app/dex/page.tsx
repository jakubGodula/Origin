import React from 'react';
import { TokenPriceChart } from '@/components/dex/TokenPriceChart';

export default function DexPage() {
    return (
        <div className="container mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-6">Strategy DEX</h1>
            <p className="text-zinc-400">
                Welcome to the Strategy Exchange. Here you can discover and follow trading strategies.
            </p>
            <div className="mb-10">
                <TokenPriceChart />
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder for strategy cards */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                    <p className="text-zinc-500">Strategies will be listed here shortly.</p>
                </div>
            </div>
        </div>
    );
}
