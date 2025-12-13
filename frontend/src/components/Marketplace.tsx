"use client";

import React, { useState, useMemo } from 'react';
import { JobCard } from './JobCard';
import { Button } from './Button';
import Link from 'next/link';
import { useJobs } from '@/hooks/useJobs';
import { LANGUAGES } from '@/utils/constants';

export const Marketplace: React.FC = () => {
    const { data: jobs, isLoading, error } = useJobs();
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
    const [showRemoteOnly, setShowRemoteOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

    const filteredJobs = useMemo(() => {
        if (!jobs) return [];

        return jobs.filter(job => {
            // Open Jobs Only (0 = Open)
            if (job.status !== 0) {
                return false;
            }

            // Language Filter
            if (selectedLanguages.length > 0 && !selectedLanguages.includes(job.language)) {
                return false;
            }

            // Remote Filter
            if (showRemoteOnly && job.locationRequired) {
                return false;
            }

            // Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = job.title.toLowerCase().includes(query);
                const matchesDesc = job.description.toLowerCase().includes(query);
                const matchesTags = job.tags.some(tag => tag.toLowerCase().includes(query));

                if (!matchesTitle && !matchesDesc && !matchesTags) {
                    return false;
                }
            }

            return true;
        });
    }, [jobs, selectedLanguages, showRemoteOnly, searchQuery]);

    const toggleLanguage = (lang: string) => {
        setSelectedLanguages(prev =>
            prev.includes(lang)
                ? prev.filter(l => l !== lang)
                : [...prev, lang]
        );
    };

    return (
        <section id="marketplace" className="py-24 px-6 bg-black/20">
            <div className="container mx-auto">
                <div className="flex flex-col gap-6 mb-12">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Marketplace
                            </h2>
                            <p className="text-zinc-400 max-w-xl">
                                Discover opportunities and connect with talent in the Sui ecosystem.
                            </p>
                        </div>

                        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <Link href="/jobs/create">
                                <Button className="w-full sm:w-auto">
                                    + List Job
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                        {/* Search */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search jobs, skills, or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Language Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                                className="w-full md:w-auto flex items-center justify-between gap-2 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-zinc-300 hover:border-white/30 transition-colors focus:outline-none focus:border-primary/50"
                            >
                                <span>{selectedLanguages.length === 0 ? 'All Languages' : `${selectedLanguages.length} Selected`}</span>
                                <span className="text-xs">▼</span>
                            </button>

                            {isLangDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsLangDropdownOpen(false)}
                                    />
                                    <div className="absolute top-full mt-2 right-0 w-56 max-h-64 overflow-y-auto bg-zinc-900 border border-white/10 rounded-lg p-2 shadow-xl z-20">
                                        {LANGUAGES.map(lang => (
                                            <div
                                                key={lang}
                                                className="flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-md cursor-pointer text-sm text-zinc-300"
                                                onClick={() => toggleLanguage(lang)}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedLanguages.includes(lang)
                                                    ? 'bg-primary border-primary'
                                                    : 'border-zinc-600'
                                                    }`}>
                                                    {selectedLanguages.includes(lang) && (
                                                        <span className="text-black text-[10px] font-bold">✓</span>
                                                    )}
                                                </div>
                                                {lang}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Remote Only Toggle */}
                        <button
                            onClick={() => setShowRemoteOnly(!showRemoteOnly)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showRemoteOnly
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-black/30 border-white/10 text-zinc-400 hover:border-white/30'
                                }`}
                        >
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${showRemoteOnly ? 'border-primary' : 'border-zinc-600'
                                }`}>
                                {showRemoteOnly && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </span>
                            Remote Only
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {isLoading && <div className="text-white">Loading jobs...</div>}
                    {error && <div className="text-red-500">Error loading jobs</div>}

                    {!isLoading && filteredJobs?.length === 0 && (
                        <div className="text-zinc-400 text-center py-12 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-xl mb-2">No matching jobs found</div>
                            <p className="text-sm">Try adjusting your filters or search terms</p>
                        </div>
                    )}

                    {filteredJobs?.map((job) => (
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
                            applicantCount={job.applicantCount}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
