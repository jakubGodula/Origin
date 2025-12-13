"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME } from '@/utils/constants';

export function EditJobClient() {
    // Switch to searchParams for export compatibility
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [details, setDetails] = useState('');
    const [price, setPrice] = useState('');
    const [paymentType, setPaymentType] = useState('0');
    const [durationValue, setDurationValue] = useState('');
    const [durationUnit, setDurationUnit] = useState('0');
    const [location, setLocation] = useState('');
    const [locationRequired, setLocationRequired] = useState(false);
    const [tags, setTags] = useState('');

    // Skills State
    const [skills, setSkills] = useState<{ name: string; years: number }[]>([]);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch Job Data
    const { data: jobData, isLoading: jobLoading, error } = useSuiClientQuery(
        'getObject',
        {
            id: id || '',
            options: { showContent: true }
        },
        { enabled: !!id }
    );

    useEffect(() => {
        if (!id) return;

        if (jobData && jobData.data?.content?.dataType === 'moveObject') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fields = jobData.data.content.fields as any;

            // Only update if we haven't initialized (or simple force update pattern)
            // But here we want to populate the form.
            // Using a timeout can sometimes bypass the synchronous check, but better to just suppress if we know it's one-off.
            // However, since we depend on jobData, meaningful changes to jobData trigger this.

            setTitle(fields.title);
            setDescription(fields.description);
            setDetails(fields.details);
            setPrice((Number(fields.budget) / 1_000_000_000).toString());
            setPaymentType(String(fields.payment_type));
            setDurationValue(String(fields.duration_value));
            setDurationUnit(String(fields.duration_unit));
            setLocation(fields.location);
            setLocationRequired(fields.location_required);

            if (Array.isArray(fields.tags)) {
                setTags(fields.tags.join(', '));
            }

            if (Array.isArray(fields.required_skills)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const loadedSkills = fields.required_skills.map((s: any) => ({
                    name: s.fields.name,
                    years: s.fields.years_experience
                }));
                setSkills(loadedSkills);
            }
            setIsFetching(false);
        } else if (error) {
            alert("Error loading job details.");
            router.push('/#marketplace');
        } else if (!jobLoading && !jobData?.data) {
            setIsFetching(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobData, error, jobLoading, id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account || !id) return;

        // Final warning
        const confirmed = window.confirm("Are you sure you want to update this job? This will ZERO OUT the current applicant count.");
        if (!confirmed) return;

        setIsLoading(true);

        const budgetMIST = BigInt(parseFloat(price) * 1_000_000_000);
        // Extend deadline logic
        const deadline = Date.now() + 30 * 24 * 60 * 60 * 1000;

        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::update_job`,
            arguments: [
                tx.object(id),
                tx.pure.string(title),
                tx.pure.string(description),
                tx.pure.string(details),
                // Skills/Tags skipped
                tx.pure.u64(budgetMIST),
                tx.pure.u8(parseInt(paymentType)),
                tx.pure.u64(parseInt(durationValue) || 0),
                tx.pure.u8(parseInt(durationUnit)),
                tx.pure.vector("u8", new TextEncoder().encode(location)),
                tx.pure.bool(locationRequired),
                tx.pure.u64(deadline),
            ],
        });

        signAndExecuteTransaction(
            { transaction: tx },
            {
                onSuccess: () => {
                    alert("Job updated successfully! Applicant count has been reset.");
                    router.push('/#marketplace');
                },
                onError: (err) => {
                    console.error("Update failed", err);
                    alert("Update failed. Ensure you are the owner.");
                },
                onSettled: () => setIsLoading(false)
            }
        );
    };

    if (!isMounted) return null;
    if (!id) return <div className="text-white p-10 text-center">Invalid Job ID.</div>;
    if (isFetching || jobLoading) return <div className="text-white p-10 text-center">Loading job data...</div>;
    if (!account) return <div className="text-white p-10 text-center">Please connect wallet.</div>;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header />
            <main className="pt-24 pb-12 px-6">
                <div className="container mx-auto max-w-2xl">
                    <button onClick={() => router.back()} className="text-zinc-400 hover:text-white mb-6">← Back</button>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                        <h1 className="text-3xl font-bold text-white mb-2">Edit Job Posting</h1>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg mb-8 text-amber-200 text-sm">
                            ⚠️ Warning: Updating this job will reset the applicant count to zero.
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Form Fields Same as Before */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Job Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Details</label>
                                <textarea value={details} onChange={e => setDetails(e.target.value)} required rows={6} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary/50 outline-none" />
                            </div>

                            <div className="bg-white/5 p-4 rounded-lg">
                                <p className="text-zinc-400 text-sm mb-2">Skills & Tags (Cannot be changed in this version)</p>
                                <div className="flex flex-wrap gap-2">
                                    {skills.map((s, i) => <span key={i} className="bg-white/10 px-2 py-1 rounded text-xs text-zinc-300">{s.name}</span>)}
                                    {tags && tags.split(',').map((t, i) => <span key={i} className="bg-white/10 px-2 py-1 rounded text-xs text-zinc-300">#{t}</span>)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Price (SUI)</label>
                                    <input type="number" step="0.1" value={price} onChange={e => setPrice(e.target.value)} required className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Payment Type</label>
                                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white outline-none">
                                        <option value="0">Fixed Price</option>
                                        <option value="1">Hourly Rate</option>
                                        <option value="2">Monthly Salary</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Duration</label>
                                    <input type="number" value={durationValue} onChange={e => setDurationValue(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Unit</label>
                                    <select value={durationUnit} onChange={e => setDurationUnit(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white outline-none">
                                        <option value="0">None</option>
                                        <option value="1">Hours</option>
                                        <option value="2">Days</option>
                                        <option value="3">Months</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Location</label>
                                <div className="flex gap-2">
                                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white outline-none" />
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={locationRequired} onChange={e => setLocationRequired(e.target.checked)} className="w-4 h-4" />
                                        <span className="text-zinc-300 text-sm">Required</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <Button type="submit" disabled={isLoading} className="flex-1 py-3 text-lg">
                                    {isLoading ? 'Updating...' : 'Update Job'}
                                </Button>
                                <Link href="/#marketplace" className="flex-1">
                                    <Button variant="secondary" type="button" className="w-full py-3 text-lg">Cancel</Button>
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
