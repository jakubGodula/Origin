"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, CANDIDATE_MODULE, CANDIDATE_PROFILE_TYPE } from '@/utils/constants';
import { CandidateProfile } from '@/types/types';

export default function ProfilePage() {
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);

    // Fetch existing profile
    const { data: profileData, refetch: refetchProfile } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: { StructType: CANDIDATE_PROFILE_TYPE },
            options: { showContent: true }
        },
        {
            enabled: !!account,
        }
    );

    const [formData, setFormData] = useState({
        role: 'candidate' as 'candidate' | 'employer',
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

    const [existingProfileId, setExistingProfileId] = useState<string | null>(null);

    // Populate form when profile data is fetched
    useEffect(() => {
        if (profileData && profileData.data && profileData.data.length > 0) {
            const object = profileData.data[0].data?.content as unknown as { fields: CandidateProfile };
            if (object && object.fields) {
                const fields = object.fields;
                setExistingProfileId(fields.id.id);

                setFormData({
                    role: 'candidate', // Currently only candidate supported in contract
                    name: fields.name,
                    bio: fields.bio,
                    portfolio: fields.portfolio_link,
                    skills: fields.skills,
                    location: fields.location,
                    nationality: fields.nationality,
                    preferredCurrency: fields.preferred_currency,
                    pictureUrl: fields.picture_url,
                    locationPrivate: fields.location_private,
                    nationalityPrivate: fields.nationality_private,
                    contactInfo: fields.contact_info.map(c => ({ value: c.value, isPrivate: c.is_private })),
                    hourlyRate: fields.hourly_rate,
                    emergencyRate: fields.emergency_rate ? fields.emergency_rate.fields.value : '',
                    emergencyRateEnabled: !!fields.emergency_rate,
                    minimalEngagementTime: fields.minimal_engagement_time ? fields.minimal_engagement_time.fields.value : '',
                    minimalEngagementTimeEnabled: !!fields.minimal_engagement_time
                });
            }
        }
    }, [profileData]);

    const [newSkill, setNewSkill] = useState('');
    const [newContact, setNewContact] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (field: 'locationPrivate' | 'nationalityPrivate' | 'emergencyRateEnabled' | 'minimalEngagementTimeEnabled') => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleRoleChange = (role: 'candidate' | 'employer') => {
        setFormData(prev => ({ ...prev, role }));
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
        if (!account) {
            alert("Please connect your wallet first");
            return;
        }
        setIsLoading(true);

        try {
            const tx = new Transaction();

            const functionName = existingProfileId ? 'update_profile' : 'create_profile';
            const args = [
                tx.pure.string(formData.name),
                tx.pure.string(formData.bio),
                tx.pure.string(formData.portfolio),
                tx.makeMoveVec({ type: '0x1::string::String', elements: formData.skills.map(s => tx.pure.string(s)) }),
                tx.pure.string(formData.location),
                tx.pure.string(formData.nationality),
                tx.pure.string(formData.preferredCurrency),
                tx.pure.string(formData.pictureUrl),
                tx.pure.bool(formData.locationPrivate),
                tx.pure.bool(formData.nationalityPrivate),
                tx.makeMoveVec({ type: '0x1::string::String', elements: formData.contactInfo.map(c => tx.pure.string(c.value)) }),
                tx.makeMoveVec({ type: 'bool', elements: formData.contactInfo.map(c => tx.pure.bool(c.isPrivate)) }),
                tx.pure.u64(Number(formData.hourlyRate)),
                tx.pure.u64(Number(formData.emergencyRate || 0)),
                tx.pure.bool(formData.emergencyRateEnabled),
                tx.pure.u64(Number(formData.minimalEngagementTime || 0)),
                tx.pure.bool(formData.minimalEngagementTimeEnabled),
            ];

            if (existingProfileId) {
                // For update, the first argument is the profile object
                args.unshift(tx.object(existingProfileId));
            }

            tx.moveCall({
                target: `${PACKAGE_ID}::${CANDIDATE_MODULE}::${functionName}`,
                arguments: args,
            });

            signAndExecuteTransaction(
                {
                    transaction: tx,
                },
                {
                    onSuccess: async () => {
                        alert("Profile saved successfully!");
                        await refetchProfile();
                    },
                    onError: (err) => {
                        console.error("Transaction failed:", err);
                        alert("Failed to save profile. See console for details.");
                    }
                }
            );
        } catch (error) {
            console.error("Error preparing transaction:", error);
            alert("An error occurred. See console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!account) {
        return (
            <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
                <Header />
                <main className="pt-24 pb-12 px-6 flex flex-col items-center justify-center min-h-[60vh]">
                    <h1 className="text-3xl font-bold text-white mb-4">Connect Wallet</h1>
                    <p className="text-zinc-400 mb-8">Please connect your wallet to manage your profile.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header />

            <main className="pt-24 pb-12 px-6">
                <div className="container mx-auto max-w-2xl">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                        <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
                        <p className="text-zinc-400 mb-8">Manage your {formData.role} profile. This information will be used to autofill {formData.role === 'candidate' ? 'job applications' : 'job postings'}.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Role Selection */}
                            <div className="flex p-1 bg-black/20 rounded-lg border border-white/10 mb-8">
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('candidate')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === 'candidate'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    Candidate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange('employer')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.role === 'employer'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    Employer
                                </button>
                            </div>

                            {/* Profile Picture Placeholder */}
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden relative">
                                    {formData.pictureUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={formData.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl text-zinc-600">
                                            {formData.role === 'candidate' ? '👤' : '🏢'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label htmlFor="pictureUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                                        {formData.role === 'candidate' ? 'Profile Picture URL' : 'Company Logo URL'}
                                    </label>
                                    <input
                                        type="url"
                                        id="pictureUrl"
                                        name="pictureUrl"
                                        value={formData.pictureUrl}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                                    {formData.role === 'candidate' ? 'Full Name' : 'Company Name'}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    placeholder={formData.role === 'candidate' ? "John Doe" : "Acme Corp"}
                                />
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-zinc-300 mb-2">
                                    {formData.role === 'candidate' ? 'Bio' : 'Company Description'}
                                </label>
                                <textarea
                                    id="bio"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                    placeholder={formData.role === 'candidate' ? "Brief introduction about yourself..." : "Tell us about your company..."}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label htmlFor="location" className="block text-sm font-medium text-zinc-300">
                                            {formData.role === 'candidate' ? 'Location' : 'Headquarters'}
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
                                            {formData.role === 'candidate' ? 'Nationality' : 'Origin'}
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
                                        placeholder={formData.role === 'candidate' ? "Nationality" : "Country of Origin"}
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

                            {/* Candidate Specific Fields */}
                            {formData.role === 'candidate' && (
                                <>
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
                                            required={formData.role === 'candidate'}
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
                                </>
                            )}

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
                                    {formData.role === 'candidate' ? 'Portfolio Link' : 'Website'}
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

                            {/* Candidate Specific Fields */}
                            {formData.role === 'candidate' && (
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
                            )}

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
