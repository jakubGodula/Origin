"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { getJobById } from '@/utils/mockData';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function JobApplicationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [isLoading, setIsLoading] = useState(false);
    const [jobTitle, setJobTitle] = useState("");

    // State for form fields
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        portfolio: '',
        coverLetter: ''
    });

    useEffect(() => {
        if (id) {
            const job = getJobById(Number(id));
            if (job) {
                setJobTitle(job.title);
            }
        }
    }, [id]);

    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            setFormData(prev => ({
                ...prev,
                name: profile.name || '',
                portfolio: profile.portfolio || '',
                coverLetter: profile.bio ? `Here is my bio: ${profile.bio}\n\nAnd my skills: ${profile.skills}` : ''
            }));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        alert("Application submitted successfully! (Simulation)");
        router.push(`/jobs/view?id=${id}`);
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
                            {isLoading ? 'Submitting...' : 'Submit Application'}
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
