"use client";

import React, { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { useJobs } from '@/hooks/useJobs';
import Link from 'next/link';
import { notFound, useSearchParams } from 'next/navigation';
import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { PACKAGE_ID, MODULE_NAME } from '@/utils/constants';
import { getRelativeTime } from '@/utils/format';
function JobDetailsContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { data: jobs, isLoading } = useJobs();

    const [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const account = useCurrentAccount();
    const job = jobs?.find(j => j.id === id);
    const isOwner = isMounted && !!job && account?.address === job.postedBy;

    const getDurationLabel = (value: number, unit: number) => {
        if (unit === 0) return 'Indefinite';
        const units = ['', 'Hour', 'Day', 'Month'];
        const unitLabel = units[unit] || '';
        return `${value} ${unitLabel}${value > 1 ? 's' : ''} `;
    };

    const getPaymentTypeLabel = (type: number) => {
        const types = ['Fixed Price', 'Hourly Rate', 'Monthly Salary'];
        return types[type] || 'Unknown';
    };

    // Fetch Applicants (Owner Only)
    // Always call the hook, but control execution via 'enabled'
    const { data: applicationsData } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::JobApplication` },
            options: { showContent: true }
        },
        { enabled: !!isOwner }
    );

    // Early returns MUST happen after all hooks
    if (!id) {
        return notFound();
    }

    if (isLoading) {
        return <div className="text-white text-center">Loading job details...</div>;
    }

    if (!job) {
        return <div className="text-white text-center">Job not found</div>;
    }

    const jobApplications = (applicationsData?.data || [])
        .map(obj => {
            if (obj.data?.content?.dataType === 'moveObject') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return obj.data.content.fields as any;
            }
            return null;
        })
        .filter(app => {
            if (!app || app.job_id !== id) return false;
            // Filter by version
            if (job && app.job_version !== undefined) {
                return Number(app.job_version) === job.job_version;
            }
            return true;
        });

    // Take top 5
    const topCandidates = jobApplications.slice(0, 5);
    const applicantCount = jobApplications.length;

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
                        <div className="flex flex-wrap gap-2 mb-4">
                            {job.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 text-sm font-medium rounded-full bg-white/10 text-zinc-300 border border-white/5"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-6 text-zinc-400">
                            {job.location && (
                                <div className="flex items-center gap-2">
                                    <span>📍</span>
                                    <span>{job.location}</span>
                                    {job.locationRequired && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Required</span>}
                                </div>
                            )}
                            {(job.durationUnit !== 0 || job.durationValue > 0) && (
                                <div className="flex items-center gap-2">
                                    <span>⏱️</span>
                                    <span>{getDurationLabel(job.durationValue, job.durationUnit)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span className="text-3xl font-mono font-bold text-primary">
                            {job.price} SUI
                        </span>
                        <span className="text-sm text-zinc-500">{getPaymentTypeLabel(job.paymentType)}</span>
                        {isOwner && (
                            <Link href={`/jobs/edit?id=${id}`}>
                                <Button className="mt-2 bg-white/10 hover:bg-white/20 border border-white/10">
                                    Edit Job
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="h-px w-full bg-white/10 mb-8" />

                <div className="prose prose-invert max-w-none mb-12">
                    <h3 className="text-xl font-semibold text-white mb-4">Description</h3>
                    <p className="text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                        {job.description}
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-4">Details</h3>
                    <p className="text-zinc-300 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                        {job.details}
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-4">Required Skills</h3>
                    <div className="flex flex-wrap gap-3">
                        {job.required_skills.map((skill, index) => (
                            <div key={index} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
                                <span className="text-white font-medium">{skill.name}</span>
                                <span className="text-zinc-500 text-sm">{skill.years_experience}y exp</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-black/30 rounded-xl p-6 mb-8 border border-white/5">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                        Job Metadata
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <span className="block text-xs text-zinc-500 mb-1">Posted By</span>
                            <span className="font-mono text-zinc-300 break-all">{job.postedBy}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-zinc-500 mb-1">Posted At</span>
                            <span className="text-zinc-300">{job.postedAt}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-zinc-500 mb-1">Job ID</span>
                            <span className="font-mono text-zinc-300 break-all">{job.id}</span>
                        </div>
                    </div>
                </div>

                {/* Owner Section: Applicants */}
                {isOwner && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Candidates ({applicantCount})</h3>
                            <Link href={`/jobs/applicants?id=${id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
                                View All →
                            </Link>
                        </div>

                        {topCandidates.length > 0 ? (
                            <div className="space-y-4">
                                {topCandidates.map((app) => (
                                    <div key={app.id.id} className="bg-black/20 p-4 rounded-lg flex justify-between items-center">
                                        <div>
                                            <Link href={`/profile/view?address=${app.applicant}`} className="group block">
                                                <div className="text-sm text-zinc-300 font-mono mb-1 group-hover:text-primary transition-colors">
                                                    {app.applicant.slice(0, 6)}...{app.applicant.slice(-4)}
                                                </div>
                                            </Link>
                                            <div className="text-xs text-zinc-500">
                                                Applied {getRelativeTime(Number(app.applied_at))}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-primary font-mono font-bold text-sm">
                                                {Number(app.proposed_price) / 1_000_000_000} SUI
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="text-center pt-2">
                                    <Link href={`/jobs/applicants?id=${id}`} className="text-zinc-400 text-xs hover:text-white">
                                        Show all {applicantCount} candidates
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="text-zinc-500 text-sm">No applicants yet.</div>
                        )}
                    </div>
                )}

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
