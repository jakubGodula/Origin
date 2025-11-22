"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        portfolio: '',
        skills: [] as string[],
        location: '',
        nationality: '',
        preferredCurrency: 'USD',
        pictureUrl: '',
        locationPrivate: false,
        nationalityPrivate: false,
        contactInfo: [] as { value: string; isPrivate: boolean }[],
        hourlyRate: '',
        emergencyRate: '',
        emergencyRateEnabled: false,
        minimalEngagementTime: '',
        minimalEngagementTimeEnabled: false
    });

    const [newSkill, setNewSkill] = useState('');
    const [newContact, setNewContact] = useState('');

    useEffect(() => {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            // Wrap in setTimeout to avoid "synchronous setState in effect" lint warning
            setTimeout(() => {
                setFormData(JSON.parse(savedProfile));
            }, 0);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (field: 'locationPrivate' | 'nationalityPrivate' | 'emergencyRateEnabled' | 'minimalEngagementTimeEnabled') => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleAddSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            e.preventDefault();
            if (!formData.skills.includes(newSkill.trim())) {
                setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            }
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill !== skillToRemove) }));
    };

    const handleAddContact = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newContact.trim()) {
            e.preventDefault();

            // Validate format: [Type]: [Handle]
            const contactRegex = /^.+: .+$/;
            if (!contactRegex.test(newContact.trim())) {
                alert("Invalid format! Please use '[Type]: [Handle]' (e.g., 'Email: test@example.com')");
                return;
            }

            if (!formData.contactInfo.some(c => c.value === newContact.trim())) {
                setFormData(prev => ({
                    ...prev,
                    contactInfo: [...prev.contactInfo, { value: newContact.trim(), isPrivate: false }]
                }));
            }
            setNewContact('');
        }
    };

    const handleRemoveContact = (valueToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            contactInfo: prev.contactInfo.filter(c => c.value !== valueToRemove)
        }));
    };

    const handleToggleContactPrivacy = (value: string) => {
        setFormData(prev => ({
            ...prev,
            contactInfo: prev.contactInfo.map(c =>
                c.value === value ? { ...c, isPrivate: !c.isPrivate } : c
            )
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate saving to blockchain/storage
        await new Promise(resolve => setTimeout(resolve, 800));

        localStorage.setItem('userProfile', JSON.stringify(formData));

        alert("Profile saved successfully!");
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header />

            <main className="pt-24 pb-12 px-6">
                <div className="container mx-auto max-w-2xl">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                        <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
                        <p className="text-zinc-400 mb-8">Manage your candidate profile. This information will be used to autofill job applications.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Profile Picture Placeholder */}
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden relative">
                                    {formData.pictureUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={formData.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl text-zinc-600">👤</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="pictureUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Profile Picture URL
                                    </label>
                                    <input
                                        type="url"
                                        id="pictureUrl"
                                        name="pictureUrl"
                                        value={formData.pictureUrl}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="https://example.com/avatar.jpg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                    placeholder="Brief introduction about yourself..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="location" className="block text-sm font-medium text-zinc-300">
                                            Location
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500">Private</span>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle('locationPrivate')}
                                                className={`w-8 h-4 rounded-full transition-colors relative ${formData.locationPrivate ? 'bg-primary' : 'bg-zinc-600'}`}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${formData.locationPrivate ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="nationality" className="block text-sm font-medium text-zinc-300">
                                            Nationality
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500">Private</span>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle('nationalityPrivate')}
                                                className={`w-8 h-4 rounded-full transition-colors relative ${formData.nationalityPrivate ? 'bg-primary' : 'bg-zinc-600'}`}
                                            >
                                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${formData.nationalityPrivate ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        id="nationality"
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="Nationality"
                                    />
                                </div>
                            </div>

                            {(formData.locationPrivate || formData.nationalityPrivate) && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm text-yellow-200">
                                    Making any of the fields private will increase the security of your data in exchange for a slight increase in complexity and the cost of revealing that data to the possible clients.
                                </div>
                            )}

                            <div>
                                <label htmlFor="preferredCurrency" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Preferred Currency
                                </label>
                                <select
                                    id="preferredCurrency"
                                    name="preferredCurrency"
                                    value={formData.preferredCurrency}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="SUI">SUI</option>
                                    <option value="USDC">USDC</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="hourlyRate" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Hourly Rate (Required)
                                </label>
                                <input
                                    type="number"
                                    id="hourlyRate"
                                    name="hourlyRate"
                                    value={formData.hourlyRate}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="e.g. 50"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="emergencyRate" className="block text-sm font-medium text-zinc-300">
                                        Emergency Rate
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleToggle('emergencyRateEnabled')}
                                        className={`w-8 h-4 rounded-full transition-colors relative ${formData.emergencyRateEnabled ? 'bg-primary' : 'bg-zinc-600'}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${formData.emergencyRateEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {formData.emergencyRateEnabled && (
                                    <input
                                        type="number"
                                        id="emergencyRate"
                                        name="emergencyRate"
                                        value={formData.emergencyRate}
                                        onChange={handleChange}
                                        required={formData.emergencyRateEnabled}
                                        min="0"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="e.g. 100"
                                    />
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="minimalEngagementTime" className="block text-sm font-medium text-zinc-300">
                                        Minimal Engagement Time (Hours)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleToggle('minimalEngagementTimeEnabled')}
                                        className={`w-8 h-4 rounded-full transition-colors relative ${formData.minimalEngagementTimeEnabled ? 'bg-primary' : 'bg-zinc-600'}`}
                                    >
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${formData.minimalEngagementTimeEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                {formData.minimalEngagementTimeEnabled && (
                                    <input
                                        type="number"
                                        id="minimalEngagementTime"
                                        name="minimalEngagementTime"
                                        value={formData.minimalEngagementTime}
                                        onChange={handleChange}
                                        required={formData.minimalEngagementTimeEnabled}
                                        min="0"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="e.g. 4"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Contact Information
                                </label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newContact}
                                            onChange={(e) => setNewContact(e.target.value)}
                                            onKeyDown={handleAddContact}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                            placeholder="[Type]: [Handle] (e.g. Email: test@example.com)"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.contactInfo.map((contact, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                                                <span className="text-sm text-zinc-300">{contact.value}</span>

                                                {/* Privacy Toggle */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleContactPrivacy(contact.value)}
                                                    className={`w-6 h-3 rounded-full transition-colors relative ${contact.isPrivate ? 'bg-primary' : 'bg-zinc-600'}`}
                                                    title={contact.isPrivate ? "Private" : "Public"}
                                                >
                                                    <div className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white transition-transform ${contact.isPrivate ? 'translate-x-3' : 'translate-x-0'}`} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveContact(contact.value)}
                                                    className="text-zinc-500 hover:text-white transition-colors ml-1"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="portfolio" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Portfolio Link
                                </label>
                                <input
                                    type="url"
                                    id="portfolio"
                                    name="portfolio"
                                    value={formData.portfolio}
                                    onChange={handleChange}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Skills
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        onKeyDown={handleAddSkill}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="Type a skill and press Enter"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {formData.skills.map((skill, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-full border border-primary/30">
                                                <span className="text-sm text-primary-foreground">{skill}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="text-primary-foreground/70 hover:text-white transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full py-3 text-lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
