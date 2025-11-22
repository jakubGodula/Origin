"use client";

import React from 'react';
import { JobCard } from './JobCard';
import { MOCK_JOBS } from '@/utils/mockData';
import { Button } from './Button';
import Link from 'next/link';

export const Marketplace: React.FC = () => {
    return (
        <section id="marketplace" className="py-24 px-6 bg-black/20">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Marketplace
                        </h2>
                        <p className="text-zinc-400 max-w-xl">
                            Discover opportunities and connect with talent in the Sui ecosystem.
                        </p>
                    </div>

                    <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-4">
                        <Link href="/jobs/create">
                            <Button className="w-full sm:w-auto">
                                + List Job
                            </Button>
                        </Link>
                        <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zinc-300 focus:outline-none focus:border-primary/50">
                            <option>All Categories</option>
                            <option>Development</option>
                            <option>Design</option>
                            <option>Marketing</option>
                        </select>
                        <select className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zinc-300 focus:outline-none focus:border-primary/50">
                            <option>Newest First</option>
                            <option>Price: High to Low</option>
                            <option>Price: Low to High</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {MOCK_JOBS.map((job) => (
                        <JobCard
                            key={job.id}
                            id={job.id}
                            title={job.title}
                            description={job.description}
                            price={job.price}
                            tags={job.tags}
                            postedBy={job.postedBy}
                            postedAt={job.postedAt}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
