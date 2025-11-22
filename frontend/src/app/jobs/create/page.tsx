"use client";

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CreateJobPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        alert("Job listed successfully! (Simulation)");
        router.push('/#marketplace');
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header />

            <main className="pt-24 pb-12 px-6">
                <div className="container mx-auto max-w-2xl">
                    <Link href="/#marketplace" className="inline-flex items-center text-zinc-400 hover:text-primary mb-8 transition-colors">
                        ← Back to Marketplace
                    </Link>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                        <h1 className="text-3xl font-bold text-white mb-2">Post a Job</h1>
                        <p className="text-zinc-400 mb-8">Fill in the details to list your opportunity on the Sui Origin marketplace.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Job Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="e.g. Senior Move Developer"
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    required
                                    rows={6}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                    placeholder="Describe the role, requirements, and responsibilities..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Price (SUI)
                                    </label>
                                    <input
                                        type="number"
                                        id="price"
                                        required
                                        min="0"
                                        step="0.1"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="e.g. 5000"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="tags" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        id="tags"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="e.g. DeFi, Rust, Remote (comma separated)"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <Button
                                    type="submit"
                                    className="flex-1 py-3 text-lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Creating Listing...' : 'Create Listing'}
                                </Button>
                                <Link href="/#marketplace" className="flex-1">
                                    <Button variant="secondary" type="button" className="w-full py-3 text-lg">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
