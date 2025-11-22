"use client";

import React, { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { getJobById } from '@/utils/mockData';
import Link from 'next/link';
import { notFound, useSearchParams } from 'next/navigation';

function JobDetailsContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) {
        return notFound();
    }

    const job = getJobById(Number(id));

    if (!job) {
        return notFound();
    }

    return (
        <div className="container mx-auto max-w-4xl">
            <Link href="/#marketplace" className="inline-flex items-center text-zinc-400 hover:text-primary mb-8 transition-colors">
                ← Back to Marketplace
            </Link>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            {job.title}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            {job.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 text-sm font-medium rounded-full bg-white/10 text-zinc-300 border border-white/5"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span className="text-3xl font-mono font-bold text-primary">
                            {job.price} SUI
                        </span>
                        <span className="text-sm text-zinc-500">Fixed Price</span>
                    </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-8" />

                <div className="prose prose-invert max-w-none mb-12">
                    <h3 className="text-xl font-semibold text-white mb-4">Description</h3>
                    <p className="text-zinc-300 text-lg leading-relaxed">
                        {job.description}
                    </p>
                </div>

                <div className="bg-black/30 rounded-xl p-6 mb-8 border border-white/5">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                        Job Metadata
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs text-zinc-500 mb-1">Posted By</span>
                            <span className="font-mono text-zinc-300">{job.postedBy}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-zinc-500 mb-1">Posted At</span>
                            <span className="text-zinc-300">{job.postedAt}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-zinc-500 mb-1">Job ID</span>
                            <span className="font-mono text-zinc-300">#{job.id}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href={`/jobs/apply?id=${id}`} className="flex-1">
                        <Button className="w-full text-lg py-4">
                            Apply Now
                        </Button>
                    </Link>
                    <Button variant="secondary" className="flex-1 text-lg py-4">
                        Contact Poster
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function JobDetailsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header />
            <main className="pt-24 pb-12 px-6">
                <Suspense fallback={<div className="text-white text-center">Loading job details...</div>}>
                    <JobDetailsContent />
                </Suspense>
            </main>
        </div>
    );
}
