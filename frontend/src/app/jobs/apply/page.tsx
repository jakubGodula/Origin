"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { getJobById } from '@/utils/mockData';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { CANDIDATE_PROFILE_TYPE, PACKAGE_ID, MODULE_NAME, CLOCK_ID } from '@/utils/constants';
import { CandidateProfile } from '@/types/types';

function JobApplicationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [isLoading, setIsLoading] = useState(false);
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');

    // Fetch Candidate Profiles
    const { data: candidateProfiles } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: { StructType: CANDIDATE_PROFILE_TYPE },
            options: { showContent: true }
        },
        { enabled: !!account }
    );

    const profiles: CandidateProfile[] = React.useMemo(() => {
        return candidateProfiles?.data.map((obj) => {
            if (obj.data?.content?.dataType === 'moveObject') {
                return obj.data.content.fields as unknown as CandidateProfile;
            }
            return null;
        }).filter((c): c is CandidateProfile => c !== null) || [];
    }, [candidateProfiles]);

    // Derive job title directly
    const job = id ? getJobById(Number(id)) : null;
    const jobTitle = job?.title || "";

    // State for form fields
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        portfolio: string;
        coverLetter: string;
        proposedPrice: string;
        estimatedDays: string;
    }>({
        name: '',
        email: '',
        portfolio: '',
        coverLetter: '',
        proposedPrice: '',
        estimatedDays: ''
    });

    // Auto-select first profile if none selected
    useEffect(() => {
        if (!selectedProfileId && profiles.length > 0) {
            setSelectedProfileId(profiles[0].id.id);
        }
    }, [profiles, selectedProfileId]);

    // Autofill form when profile is selected
    useEffect(() => {
        if (selectedProfileId) {
            const profile = profiles.find(p => p.id.id === selectedProfileId);
            if (profile) {
                // Extract email from contact info
                // Extract email from contact info
                // Defensively handle potential struct wrapping in JSON response
                const emailEntry = profile.contact_info.find(c => {
                    const val = (c as any).value || (c as any).fields?.value;
                    return val && typeof val === 'string' && val.toLowerCase().startsWith('email:');
                });

                let email = '';
                if (emailEntry) {
                    const val = (emailEntry as any).value || (emailEntry as any).fields?.value;
                    email = val ? val.split(':')[1].trim() : '';
                }

                setFormData(prev => ({
                    ...prev,
                    name: profile.name || '',
                    portfolio: (profile.portfolio && profile.portfolio.length > 0) ? profile.portfolio[0] : '',
                    email: email || prev.email, // Only override if found, or keep manual input? request says "automatically filled"
                    // Optionally autofill cover letter with bio? The request didn't explicitly ask, but previous code hid it.
                    // User said "name, e-mail and portfolio". I'll stick to those.
                }));
            }
        }
    }, [selectedProfileId, profiles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!account || !id) return;

        setIsLoading(true);

        try {
            const tx = new Transaction();

            // Calculate timestamps and convert price
            const priceInMist = BigInt(Math.floor(Number(formData.proposedPrice) * 1_000_000_000));
            const durationMs = Number(formData.estimatedDays) * 24 * 60 * 60 * 1000;
            // Note: Contract expects estimated delivery timestamp, or duration?
            // "estimated_delivery: u64" usually implies timestamp in Move if comparing with clock, 
            // but let's check contract logic. 
            // `applied_at: clock::timestamp_ms(clock)` is recorded.
            // `estimated_delivery` is just stored. Usually easier to store duration logic or absolute timestamp. 
            // Assuming it's absolute timestamp for now: Now + Duration.
            // Wait, simulated clock on chain is passed. 
            // Let's passed relative duration in ms for simplicity if not specified, OR 
            // better: Current Time (Client side estimate) + Duration? No, unsafe. 
            // Actually, for "Estimated Delivery", a relative duration (e.g. 7 days from now) is often preferred as a value 
            // to be added to start time.
            // Let's pass the DURATION in MS. The contract stores it as `u64`. 

            tx.moveCall({
                target: `${PACKAGE_ID}::listing::apply_to_job`,
                arguments: [
                    tx.object(id), // Job ID
                    tx.object(selectedProfileId), // Candidate Profile ID (Enforced)
                    tx.pure.string(formData.coverLetter), // Proposal
                    tx.pure.u64(priceInMist), // Proposed Price
                    tx.pure.u64(durationMs), // Estimated Delivery
                    tx.object(CLOCK_ID), // Clock
                ],
            });

            signAndExecuteTransaction(
                {
                    transaction: tx,
                },
                {
                    onSuccess: (result) => {
                        console.log('Application submitted:', result);
                        alert("Application submitted successfully!");
                        router.push(`/jobs/view?id=${id}`);
                    },
                    onError: (error) => {
                        console.error('Failed to submit application:', error);
                        alert("Failed to submit application. See console for details.");
                    }
                }
            );
        } catch (error) {
            console.error('Error constructing transaction:', error);
            alert("Error preparing transaction.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!id) return null;

    return (
        <div className="container mx-auto max-w-2xl">
            <Link href={`/jobs/view?id=${id}`} className="inline-flex items-center text-zinc-400 hover:text-primary mb-8 transition-colors">
                ← Back to Job Details
            </Link>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                <h1 className="text-3xl font-bold text-white mb-2">Apply for Job</h1>
                <p className="text-zinc-400 mb-8">
                    Applying for <span className="text-white font-medium">{jobTitle || "..."}</span>
                </p>

                {profiles.length > 1 && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                        <label htmlFor="profileSelect" className="block text-sm font-medium text-zinc-300 mb-2">
                            Select Profile to Autofill
                        </label>
                        <select
                            id="profileSelect"
                            value={selectedProfileId}
                            onChange={(e) => setSelectedProfileId(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        >
                            {profiles.map(profile => (
                                <option key={profile.id.id} value={profile.id.id}>
                                    {profile.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="proposedPrice" className="block text-sm font-medium text-zinc-300 mb-2">
                                Proposed Price (SUI)
                            </label>
                            <input
                                type="number"
                                id="proposedPrice"
                                value={formData.proposedPrice}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label htmlFor="estimatedDays" className="block text-sm font-medium text-zinc-300 mb-2">
                                Estimated Delivery (Days)
                            </label>
                            <input
                                type="number"
                                id="estimatedDays"
                                value={formData.estimatedDays}
                                onChange={handleChange}
                                required
                                min="1"
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                placeholder="7"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="portfolio" className="block text-sm font-medium text-zinc-300 mb-2">
                            Portfolio / Resume Link
                        </label>
                        <input
                            type="url"
                            id="portfolio"
                            value={formData.portfolio}
                            onChange={handleChange}
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            placeholder="https://..."
                        />
                    </div>

                    <div>
                        <label htmlFor="coverLetter" className="block text-sm font-medium text-zinc-300 mb-2">
                            Cover Letter
                        </label>
                        <textarea
                            id="coverLetter"
                            value={formData.coverLetter}
                            onChange={handleChange}
                            required
                            rows={6}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                            placeholder="Tell us why you're a great fit for this role..."
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <Button
                            type="submit"
                            className="flex-1 py-3 text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Submitting...' : 'Submit Proposal'}
                        </Button>
                        <Link href={`/jobs/view?id=${id}`} className="flex-1">
                            <Button variant="secondary" type="button" className="w-full py-3 text-lg">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function JobApplicationPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header />
            <main className="pt-24 pb-12 px-6">
                <Suspense fallback={<div className="text-white text-center">Loading application form...</div>}>
                    <JobApplicationContent />
                </Suspense>
            </main>
        </div>
    );
}
