"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { PACKAGE_ID, CANDIDATE_MODULE, CANDIDATE_PROFILE_TYPE, EMPLOYER_MODULE, EMPLOYER_PROFILE_TYPE } from '@/utils/constants';
import { CandidateProfile, EmployerProfile } from '@/types/types';

export default function ProfilePage() {
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'edit' | 'create'>('list');

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

    // Fetch Candidate Profiles
    const { data: candidateProfiles, refetch: refetchCandidates } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: { StructType: CANDIDATE_PROFILE_TYPE },
            options: { showContent: true }
        },
        { enabled: !!account }
    );

    // Fetch Employer Profiles
    const { data: employerProfiles, refetch: refetchEmployers } = useSuiClientQuery(
        'getOwnedObjects',
        {
            owner: account?.address || '',
            filter: { StructType: EMPLOYER_PROFILE_TYPE },
            options: { showContent: true }
        },
        { enabled: !!account }
    );

    const [existingProfileId, setExistingProfileId] = useState<string | null>(null);

    // Combine profiles for the list view
    const allProfiles = [
        ...(candidateProfiles?.data?.map(p => ({ ...p, type: 'candidate' })) || []),
        ...(employerProfiles?.data?.map(p => ({ ...p, type: 'employer' })) || [])
    ];

    const [hasAutoRedirected, setHasAutoRedirected] = useState(false);

    // Effect to switch to create mode if no profiles exist and we are in list mode
    useEffect(() => {
        if (viewMode === 'list' && account && !isLoading && candidateProfiles && employerProfiles) {
            if (allProfiles.length === 0 && !hasAutoRedirected) {
                handleCreateNew();
                setHasAutoRedirected(true);
            }
        }
    }, [allProfiles.length, viewMode, account, candidateProfiles, employerProfiles, isLoading, hasAutoRedirected]);


    const handleEditProfile = (profile: any, type: 'candidate' | 'employer') => {
        const content = profile.data?.content;
        if (content && 'fields' in content) {
            const fields = content.fields as any;
            setExistingProfileId(fields.id.id);

            const getOptionValue = (option: any) => {
                if (!option) return null;
                if (option.fields && option.fields.vec) return option.fields.vec[0];
                if (option.vec) return option.vec[0];
                return null;
            };

            if (type === 'candidate') {
                const candidateFields = fields as CandidateProfile;
                const emergencyRateVal = getOptionValue(candidateFields.emergency_rate);
                const minimalEngagementTimeVal = getOptionValue(candidateFields.minimal_engagement_time);

                setFormData({
                    role: 'candidate',
                    name: candidateFields.name,
                    bio: candidateFields.bio,
                    portfolio: candidateFields.portfolio_link,
                    skills: candidateFields.skills,
                    location: candidateFields.location,
                    nationality: candidateFields.nationality,
                    preferredCurrency: candidateFields.preferred_currency,
                    pictureUrl: candidateFields.picture_url,
                    locationPrivate: candidateFields.location_private,
                    nationalityPrivate: candidateFields.nationality_private,
                    contactInfo: candidateFields.contact_info.map(c => ({ value: c.value, isPrivate: c.is_private })),
                    hourlyRate: candidateFields.hourly_rate.toString(),
                    emergencyRate: emergencyRateVal ? emergencyRateVal.toString() : '',
                    emergencyRateEnabled: !!emergencyRateVal,
                    minimalEngagementTime: minimalEngagementTimeVal ? minimalEngagementTimeVal.toString() : '',
                    minimalEngagementTimeEnabled: !!minimalEngagementTimeVal
                });
            } else {
                const employerFields = fields as EmployerProfile;
                setFormData({
                    role: 'employer',
                    name: employerFields.name,
                    bio: employerFields.bio,
                    portfolio: employerFields.website,
                    location: employerFields.location,
                    pictureUrl: employerFields.logo_url,
                    contactInfo: employerFields.contact_info.map(c => ({ value: c.value, isPrivate: c.is_private })),
                    skills: [],
                    nationality: '',
                    preferredCurrency: 'USD',
                    locationPrivate: false,
                    nationalityPrivate: false,
                    hourlyRate: '',
                    emergencyRate: '',
                    emergencyRateEnabled: false,
                    minimalEngagementTime: '',
                    minimalEngagementTimeEnabled: false
                });
            }
            setViewMode('edit');
        }
    };

    const handleCreateNew = () => {
        setExistingProfileId(null);
        setFormData({
            role: 'candidate', // Default to candidate
            name: '',
            bio: '',
            portfolio: '',
            skills: [],
            location: '',
            nationality: '',
            preferredCurrency: 'SUI',
            pictureUrl: '',
            locationPrivate: false,
            nationalityPrivate: false,
            contactInfo: [],
            hourlyRate: '',
            emergencyRate: '',
            emergencyRateEnabled: false,
            minimalEngagementTime: '',
            minimalEngagementTimeEnabled: false
        });
        setViewMode('create');
    };

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
        console.log("handleSubmit called");

        if (!account) {
            console.log("No account connected");
            alert("Please connect your wallet first");
            return;
        }

        console.log("Form Data:", formData);
        setIsLoading(true);

        try {
            console.log("Constructing transaction...");
            const tx = new Transaction();
            const isCandidate = formData.role === 'candidate';
            const moduleName = isCandidate ? CANDIDATE_MODULE : EMPLOYER_MODULE;
            const functionName = existingProfileId ? 'update_profile' : 'create_profile';

            console.log(`Role: ${formData.role}, Module: ${moduleName}, Function: ${functionName}`);

            let args: any[] = [];

            if (isCandidate) {
                console.log("Preparing Candidate args...");
                // Validate required fields for candidate
                if (!formData.name || !formData.hourlyRate) {
                    console.error("Missing required fields for candidate");
                    alert("Name and Hourly Rate are required.");
                    setIsLoading(false);
                    return;
                }

                args = [
                    tx.pure.string(formData.name),
                    tx.pure.string(formData.bio),
                    tx.pure.string(formData.portfolio),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.skills)),
                    tx.pure.string(formData.location),
                    tx.pure.string(formData.nationality),
                    tx.pure.string(formData.preferredCurrency),
                    tx.pure.string(formData.pictureUrl),
                    tx.pure.bool(formData.locationPrivate),
                    tx.pure.bool(formData.nationalityPrivate),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.contactInfo.map(c => c.value))),
                    tx.pure.vector("bool", formData.contactInfo.map(c => c.isPrivate)),
                    tx.pure.u64(Number(formData.hourlyRate)),
                    tx.pure.u64(Number(formData.emergencyRate || 0)),
                    tx.pure.bool(formData.emergencyRateEnabled),
                    tx.pure.u64(Number(formData.minimalEngagementTime || 0)),
                    tx.pure.bool(formData.minimalEngagementTimeEnabled),
                ];
            } else {
                console.log("Preparing Employer args...");
                if (!formData.name) {
                    console.error("Missing required fields for employer");
                    alert("Name is required.");
                    setIsLoading(false);
                    return;
                }
                // Employer Args
                args = [
                    tx.pure.string(formData.name),
                    tx.pure.string(formData.bio),
                    tx.pure.string(formData.location),
                    tx.pure.string(formData.portfolio), // Website
                    tx.pure.string(formData.pictureUrl), // Logo URL
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.contactInfo.map(c => c.value))),
                    tx.pure(bcs.vector(bcs.bool()).serialize(formData.contactInfo.map(c => c.isPrivate))),
                ];
            }

            if (existingProfileId) {
                console.log("Updating existing profile:", existingProfileId);
                args.unshift(tx.object(existingProfileId));
            }

            console.log("Move Call Target:", `${PACKAGE_ID}::${moduleName}::${functionName}`);
            // console.log("Args prepared:", args); // Args might be complex objects, logging them might be noisy but useful

            tx.moveCall({
                target: `${PACKAGE_ID}::${moduleName}::${functionName}`,
                arguments: args,
            });

            console.log("Executing transaction...");
            signAndExecuteTransaction(
                {
                    transaction: tx,
                },
                {
                    onSuccess: async (result) => {
                        console.log("Transaction successful!", result);
                        alert("Profile saved successfully!");
                        await Promise.all([refetchCandidates(), refetchEmployers()]);
                        setViewMode('list');
                    },
                    onError: (err) => {
                        console.error("Transaction failed inside onError:", err);
                        alert(`Failed to save profile: ${err.message}`);
                    }
                }
            );
        } catch (e: any) {
            console.error("Error in handleSubmit:", e);
            alert(`An error occurred: ${e.message}`);
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
                    {viewMode === 'list' ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-3xl font-bold text-white">Your Profiles</h1>
                                <Button onClick={handleCreateNew}>
                                    Create New Profile
                                </Button>
                            </div>

                            {allProfiles.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-zinc-400 mb-4">You haven't created any profiles yet.</p>
                                    <Button onClick={handleCreateNew} variant="secondary">
                                        Create Your First Profile
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {allProfiles.map((profile: any) => {
                                        const fields = profile.data?.content?.fields;
                                        const type = profile.type;
                                        const name = fields?.name || 'Unnamed Profile';
                                        const bio = fields?.bio || '';
                                        const image = type === 'candidate' ? fields?.picture_url : fields?.logo_url;

                                        return (
                                            <div key={fields?.id?.id} className="bg-black/20 border border-white/10 rounded-xl p-6 flex items-center gap-4 hover:bg-black/30 transition-colors">
                                                <div className="w-16 h-16 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                                                    {image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={image} alt={name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                                            {type === 'candidate' ? '👤' : '🏢'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-xl font-bold text-white">{name}</h3>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${type === 'candidate' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                            {type === 'candidate' ? 'Candidate' : 'Employer'}
                                                        </span>
                                                    </div>
                                                    <p className="text-zinc-400 text-sm line-clamp-1">{bio}</p>
                                                </div>
                                                <Button onClick={() => handleEditProfile(profile, type)} variant="secondary" className="text-sm">
                                                    Edit
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                            <div className="flex items-center gap-4 mb-6">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    ← Back to List
                                </button>
                                <h1 className="text-3xl font-bold text-white">
                                    {viewMode === 'create' ? 'Create Profile' : 'Edit Profile'}
                                </h1>
                            </div>

                            <p className="text-zinc-400 mb-8">
                                Manage your {formData.role} profile. This information will be used to autofill {formData.role === 'candidate' ? 'job applications' : 'job postings'}.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Role Selection - Only show in create mode */}
                                {viewMode === 'create' && (
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
                                )}

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
                    )}
                </div>
            </main>
        </div>
    );
}
