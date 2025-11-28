"use client";

import React from 'react';
import { JobCard } from './JobCard';
import { Button } from './Button';
import Link from 'next/link';
import { useJobs } from '@/hooks/useJobs';

export const Marketplace: React.FC = () => {
    const { data: jobs, isLoading, error } = useJobs();

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
                    {isLoading && <div className="text-white">Loading jobs...</div>}
                    {error && <div className="text-red-500">Error loading jobs</div>}

                    {!isLoading && jobs?.length === 0 && (
                        <div className="text-zinc-400">No jobs found. Be the first to post one!</div>
                    )}

                    {jobs?.map((job) => (
                        <JobCard
                            key={job.id}
                            id={job.id}
                            title={job.title}
                            description={job.description}
                            price={job.price}
                            tags={job.tags}
                            postedBy={job.postedBy}
                            postedAt={job.postedAt}
                            durationValue={job.durationValue}
                            durationUnit={job.durationUnit}
                            location={job.location}
                            locationRequired={job.locationRequired}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
