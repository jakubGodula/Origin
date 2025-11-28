"use client";

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MARKETPLACE_ID, MODULE_NAME, CLOCK_ID } from '@/utils/constants';

export default function CreateJobPage() {
    const router = useRouter();
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);

    const [skills, setSkills] = useState<{ name: string; years: number }[]>([]);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillYears, setNewSkillYears] = useState(1);

    const addSkill = () => {
        if (newSkillName.trim()) {
            setSkills([...skills, { name: newSkillName.trim(), years: newSkillYears }]);
            setNewSkillName('');
            setNewSkillYears(1);
        }
    };

    const removeSkill = (index: number) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            alert("Please connect your wallet first");
            return;
        }
        setIsLoading(true);

        const form = e.target as HTMLFormElement;
        const title = (form.elements.namedItem('title') as HTMLInputElement).value;
        const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
        const details = (form.elements.namedItem('details') as HTMLTextAreaElement).value;
        const price = (form.elements.namedItem('price') as HTMLInputElement).value;
        const paymentType = (form.elements.namedItem('paymentType') as HTMLSelectElement).value;
        const durationValue = (form.elements.namedItem('durationValue') as HTMLInputElement).value;
        const durationUnit = (form.elements.namedItem('durationUnit') as HTMLSelectElement).value;
        const location = (form.elements.namedItem('location') as HTMLInputElement).value;
        const locationRequired = (form.elements.namedItem('locationRequired') as HTMLInputElement).checked;
        const tagsInput = (form.elements.namedItem('tags') as HTMLInputElement).value;

        // Parse tags: comma separated -> array of strings
        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        // Budget in MIST (1 SUI = 10^9 MIST)
        const budgetMIST = BigInt(parseFloat(price) * 1_000_000_000);

        // Deadline: For now, let's set it to 30 days from now
        const deadline = Date.now() + 30 * 24 * 60 * 60 * 1000;

        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::create_job`,
            arguments: [
                tx.object(MARKETPLACE_ID),
                tx.pure.string(title),
                tx.pure.string(description),
                tx.pure.string(details),
                tx.pure.vector("vector<u8>", skills.map(s => new TextEncoder().encode(s.name))), // skill_names
                tx.pure.vector("u8", skills.map(s => s.years)), // skill_exps
                tx.pure.vector("vector<u8>", tags.map(tag => new TextEncoder().encode(tag))), // tags
                tx.pure.u64(budgetMIST),
                tx.pure.u8(parseInt(paymentType)),
                tx.pure.u64(parseInt(durationValue) || 0),
                tx.pure.u8(parseInt(durationUnit)),
                tx.pure.vector("u8", new TextEncoder().encode(location)),
                tx.pure.bool(locationRequired),
                tx.pure.u64(deadline),
                tx.object(CLOCK_ID),
            ],
        });

        signAndExecuteTransaction(
            {
                transaction: tx,
            },
            {
                onSuccess: (result) => {
                    console.log('Job created:', result);
                    alert("Job listed successfully!");
                    router.push('/#marketplace');
                },
                onError: (error) => {
                    console.error('Error creating job:', error);
                    alert("Failed to create job. See console for details.");
                },
                onSettled: () => {
                    setIsLoading(false);
                }
            }
        );
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

                        {!account ? (
                            <div className="text-center py-8 text-zinc-400">
                                Please connect your wallet to post a job.
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Job Title
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
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
                                        name="description"
                                        required
                                        rows={4}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                        placeholder="Brief overview of the role..."
                                    />
                                </div>

                                <div>
                                    <label htmlFor="details" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Detailed Specification
                                    </label>
                                    <textarea
                                        id="details"
                                        name="details"
                                        required
                                        rows={6}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                        placeholder="Full project details, deliverables, and milestones..."
                                    />
                                </div>

                                {/* Skills Section */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Required Skills
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newSkillName}
                                            onChange={(e) => setNewSkillName(e.target.value)}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                                            placeholder="Skill name (e.g. Rust)"
                                        />
                                        <input
                                            type="number"
                                            value={newSkillYears}
                                            onChange={(e) => setNewSkillYears(parseInt(e.target.value))}
                                            min="1"
                                            className="w-24 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary/50"
                                            placeholder="Years"
                                        />
                                        <button
                                            type="button"
                                            onClick={addSkill}
                                            className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-lg px-4 py-2 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {skills.map((skill, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm text-white">
                                                <span>{skill.name} ({skill.years}y)</span>
                                                <button type="button" onClick={() => removeSkill(index)} className="text-zinc-400 hover:text-red-400">×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-zinc-300 mb-2">
                                            Price (SUI)
                                        </label>
                                        <input
                                            type="number"
                                            id="price"
                                            name="price"
                                            required
                                            min="0"
                                            step="0.1"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                            placeholder="e.g. 5000"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="paymentType" className="block text-sm font-medium text-zinc-300 mb-2">
                                            Payment Type
                                        </label>
                                        <select
                                            id="paymentType"
                                            name="paymentType"
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        >
                                            <option value="0">Fixed Price</option>
                                            <option value="1">Hourly Rate</option>
                                            <option value="2">Monthly Salary</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label htmlFor="durationValue" className="block text-sm font-medium text-zinc-300 mb-2">
                                                Duration
                                            </label>
                                            <input
                                                type="number"
                                                id="durationValue"
                                                name="durationValue"
                                                min="0"
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                                placeholder="Value"
                                            />
                                        </div>
                                        <div className="w-1/3">
                                            <label htmlFor="durationUnit" className="block text-sm font-medium text-zinc-300 mb-2">
                                                Unit
                                            </label>
                                            <select
                                                id="durationUnit"
                                                name="durationUnit"
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                            >
                                                <option value="0">None</option>
                                                <option value="1">Hours</option>
                                                <option value="2">Days</option>
                                                <option value="3">Months</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="location" className="block text-sm font-medium text-zinc-300 mb-2">
                                            Location
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id="location"
                                                name="location"
                                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                                placeholder="e.g. Remote, New York"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="locationRequired"
                                                    name="locationRequired"
                                                    className="w-4 h-4 rounded border-white/10 bg-black/20 text-primary focus:ring-primary/50"
                                                />
                                                <label htmlFor="locationRequired" className="text-sm text-zinc-300">Required</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="tags" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        id="tags"
                                        name="tags"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="e.g. DeFi, Rust, Remote (comma separated)"
                                    />
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
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
