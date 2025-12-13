"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';
import { PACKAGE_ID, CANDIDATE_MODULE, CANDIDATE_PROFILE_TYPE, EMPLOYER_MODULE, EMPLOYER_PROFILE_TYPE, LANGUAGES } from '@/utils/constants';
import { CandidateProfile, EmployerProfile, Language, Education, Certificate } from '@/types/types';

// Proficiency options as requested
const PROFICIENCY_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Generate a list of years. 
const generateYears = (count: number = 50) => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: count }, (_, i) => currentYear - i);
};
const YEAR_OPTIONS = generateYears(50);

export default function ProfilePage() {
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'edit' | 'create'>('list');

    const [formData, setFormData] = useState({
        role: 'candidate' as 'candidate' | 'employer',
        name: '',
        bio: '',
        portfolio: [] as string[],
        skills: [] as string[],
        location: '',
        nationalities: [] as string[],
        preferredCurrency: 'USD',
        pictureUrl: '',
        locationPrivate: false,
        nationalitiesPrivate: false,
        contactInfo: [] as { value: string; isPrivate: boolean }[],

        // New Fields
        languages: [] as Language[],
        education: [] as Education[],
        certificates: [] as Certificate[],

        hourlyRate: '',
        emergencyRate: '',
        emergencyRateEnabled: false,
        minimalEngagementTime: '',
        minimalEngagementTimeEnabled: false,
        // Hashes (kept empty for now in UI, but needed for types)
        locationHash: [] as number[],
        nationalitiesHash: [] as number[],
        contactHash: [] as number[],

        // Employer Specific
        tax_id: '',
        addressLine1: '',
        addressLine2: '',
        addressLine3: ''
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

    // Moved useEffect after handlers to ensure handleCreateNew is defined




    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditProfile = (profile: any, type: 'candidate' | 'employer') => {
        const content = profile.data?.content;
        if (content && 'fields' in content) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fields = content.fields as any;
            setExistingProfileId(fields.id.id);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getOptionValue = (option: any) => {
                if (option === null || option === undefined) return undefined;
                // Move Option: { type: ..., fields: { vec: [...] } } or { vec: [...] }
                if (typeof option === 'object') {
                    // Check for 'fields.vec' or direct 'vec'
                    let vec = null;
                    if ('fields' in option && 'vec' in option.fields) {
                        vec = option.fields.vec;
                    } else if ('vec' in option) {
                        vec = option.vec;
                    }

                    if (Array.isArray(vec) && vec.length > 0) {
                        return vec[0];
                    }
                    return null; // Empty option
                }
                return option; // Already unwrapped?
            };

            if (type === 'candidate') {
                const candidateFields = fields as CandidateProfile;
                const emergencyRateVal = getOptionValue(candidateFields.emergency_rate);
                const minimalEngagementTimeVal = getOptionValue(candidateFields.minimal_engagement_time);

                setFormData({
                    role: 'candidate',
                    name: candidateFields.name,
                    bio: candidateFields.bio,
                    portfolio: candidateFields.portfolio || [],
                    skills: candidateFields.skills,
                    location: candidateFields.location,
                    nationalities: candidateFields.nationalities || (candidateFields.nationalities ? [candidateFields.nationalities] : []), // Handle potential single/array mismatch if legacy
                    preferredCurrency: candidateFields.preferred_currency,
                    pictureUrl: candidateFields.picture_url,
                    locationPrivate: candidateFields.location_private,
                    nationalitiesPrivate: candidateFields.nationalities_private || false,
                    contactInfo: candidateFields.contact_info.map(c => ({ value: c.value, isPrivate: c.is_private })),

                    // Map new fields safely
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    languages: candidateFields.languages ? candidateFields.languages.map((l: any) => ({ language: l.fields?.language || l.language, proficiency: l.fields?.proficiency || l.proficiency })) : [],
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    education: candidateFields.education ? candidateFields.education.map((e: any) => ({
                        institution: e.fields?.institution || e.institution,
                        course: e.fields?.course || e.course,
                        degree: e.fields?.degree || e.degree,
                        start_date: e.fields?.start_date || e.start_date,
                        end_date: e.fields?.end_date || e.end_date
                    })) : [],
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    certificates: candidateFields.certificates ? candidateFields.certificates.map((c: any) => ({ name: c.fields?.name || c.name, link: c.fields?.link || c.link, date: Number(c.fields?.date || c.date) })) : [],

                    hourlyRate: (Number(candidateFields.hourly_rate)).toString(),
                    emergencyRate: emergencyRateVal ? (Number(emergencyRateVal)).toString() : '',
                    emergencyRateEnabled: !!emergencyRateVal,
                    minimalEngagementTime: minimalEngagementTimeVal ? minimalEngagementTimeVal.toString() : '',
                    minimalEngagementTimeEnabled: !!minimalEngagementTimeVal,
                    locationHash: [],
                    nationalitiesHash: [],
                    contactHash: [],
                    tax_id: '',
                    addressLine1: '',
                    addressLine2: '',
                    addressLine3: ''
                });
            } else {
                const employerFields = fields as EmployerProfile;
                setFormData({
                    role: 'employer',
                    name: employerFields.name,
                    bio: employerFields.bio,
                    portfolio: [employerFields.website],
                    location: employerFields.location,
                    pictureUrl: employerFields.logo_url,
                    contactInfo: employerFields.contact_info.map(c => ({ value: c.value, isPrivate: c.is_private })),
                    skills: [],
                    nationalities: [],
                    preferredCurrency: 'USD',
                    locationPrivate: false,
                    nationalitiesPrivate: false,
                    tax_id: employerFields.tax_id || '',
                    // Split location into lines if possible, or just put all in line 1
                    addressLine1: employerFields.location.split(', ')[0] || employerFields.location,
                    addressLine2: employerFields.location.split(', ')[1] || '',
                    addressLine3: employerFields.location.split(', ')[2] || '',
                    languages: [],
                    education: [],
                    certificates: [],
                    hourlyRate: '',
                    emergencyRate: '',
                    emergencyRateEnabled: false,
                    minimalEngagementTime: '',
                    minimalEngagementTimeEnabled: false,
                    locationHash: [],
                    nationalitiesHash: [],
                    contactHash: []
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
            portfolio: [],
            skills: [],
            location: '',
            nationalities: [],
            preferredCurrency: 'SUI',
            pictureUrl: '',
            locationPrivate: false,
            nationalitiesPrivate: false,
            contactInfo: [],
            languages: [],
            education: [],
            certificates: [],
            hourlyRate: '',
            emergencyRate: '',
            emergencyRateEnabled: false,
            minimalEngagementTime: '',
            minimalEngagementTimeEnabled: false,
            locationHash: [],
            nationalitiesHash: [],
            contactHash: [],
            tax_id: '',
            addressLine1: '',
            addressLine2: '',
            addressLine3: ''
        });
        setViewMode('create');
    };

    useEffect(() => {
        // Auto-redirect logic if no profiles
        if (!isLoading && account && allProfiles) {
            console.log("Checking auto-redirect...", { allProfiles: allProfiles.length, hasAutoRedirected });
            if (allProfiles.length === 0 && !hasAutoRedirected) {
                handleCreateNew();
                setHasAutoRedirected(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allProfiles.length, viewMode, account, candidateProfiles, employerProfiles, isLoading, hasAutoRedirected]);

    const [newSkill, setNewSkill] = useState('');
    const [newContact, setNewContact] = useState('');
    const [newNationality, setNewNationality] = useState('');
    const [newPortfolioLink, setNewPortfolioLink] = useState('');

    // New item inputs
    const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: 'A1' }); // Default A1
    const [newEducation, setNewEducation] = useState({ institution: '', course: '', degree: '', start_date: '', end_date: '' });
    const [newCertificate, setNewCertificate] = useState({ name: '', link: '', date: new Date().getFullYear() }); // Default current year

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (field: 'locationPrivate' | 'nationalitiesPrivate' | 'emergencyRateEnabled' | 'minimalEngagementTimeEnabled') => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleAddNationality = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newNationality.trim()) {
            e.preventDefault();
            if (!formData.nationalities.includes(newNationality.trim())) {
                setFormData(prev => ({ ...prev, nationalities: [...prev.nationalities, newNationality.trim()] }));
            }
            setNewNationality('');
        }
    };

    const handleRemoveNationality = (toRemove: string) => {
        setFormData(prev => ({ ...prev, nationalities: prev.nationalities.filter(n => n !== toRemove) }));
    };

    const handleAddPortfolio = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newPortfolioLink.trim()) {
            e.preventDefault();
            if (!formData.portfolio.includes(newPortfolioLink.trim())) {
                setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, newPortfolioLink.trim()] }));
            }
            setNewPortfolioLink('');
        }
    };

    const handleRemovePortfolio = (linkToRemove: string) => {
        setFormData(prev => ({ ...prev, portfolio: prev.portfolio.filter(link => link !== linkToRemove) }));
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

    // --- New Handlers ---

    const handleAddLanguage = () => {
        if (newLanguage.language && newLanguage.proficiency) {
            setFormData(prev => ({
                ...prev,
                languages: [...prev.languages, { ...newLanguage }]
            }));
            setNewLanguage({ language: '', proficiency: 'A1' });
        }
    };

    const handleRemoveLanguage = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== idx)
        }));
    };

    const handleAddEducation = () => {
        if (newEducation.institution && newEducation.course && newEducation.degree && newEducation.start_date && newEducation.end_date) {
            setFormData(prev => ({
                ...prev,
                education: [...prev.education, newEducation]
            }));
            setNewEducation({ institution: '', course: '', degree: '', start_date: '', end_date: '' });
        }
    };

    const handleRemoveEducation = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== idx)
        }));
    };

    const handleAddCertificate = () => {
        if (newCertificate.name && newCertificate.date) {
            setFormData(prev => ({
                ...prev,
                certificates: [...prev.certificates, { ...newCertificate, date: Number(newCertificate.date) }]
            }));
            setNewCertificate({ name: '', link: '', date: new Date().getFullYear() });
        }
    };

    const handleRemoveCertificate = (idx: number) => {
        setFormData(prev => ({
            ...prev,
            certificates: prev.certificates.filter((_, i) => i !== idx)
        }));
    };

    // --------------------

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

            console.log(`Role: ${formData.role}, `);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.portfolio)),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.skills)),
                    tx.pure.string(formData.location),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.nationalities)),
                    tx.pure.string(formData.preferredCurrency),
                    tx.pure.string(formData.pictureUrl),
                    tx.pure.bool(formData.locationPrivate),
                    tx.pure.bool(formData.nationalitiesPrivate),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.contactInfo.map(c => c.value))),
                    tx.pure.vector("bool", formData.contactInfo.map(c => c.isPrivate)),

                    // New Fields Vectors
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.languages.map(l => l.language))),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.languages.map(l => l.proficiency))),

                    tx.pure(bcs.vector(bcs.string()).serialize(formData.education.map(e => e.institution))),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.education.map(e => e.course))),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.education.map(e => e.degree))),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.education.map(e => e.start_date))),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.education.map(e => e.end_date))),

                    tx.pure(bcs.vector(bcs.string()).serialize(formData.certificates.map(c => c.name))),
                    tx.pure(bcs.vector(bcs.string()).serialize(formData.certificates.map(c => c.link || ""))),
                    tx.pure.vector("u64", formData.certificates.map(c => Number(c.date))),

                    tx.pure.u64(Number(formData.hourlyRate)),
                    tx.pure.u64(Number(formData.emergencyRate || 0)),
                    tx.pure.bool(formData.emergencyRateEnabled),
                    tx.pure.u64(Number(formData.minimalEngagementTime || 0)),
                    tx.pure.bool(formData.minimalEngagementTimeEnabled),
                    // Hash args (empty vectors for now)
                    tx.pure.vector("u8", formData.locationHash || []),
                    tx.pure.vector("u8", formData.nationalitiesHash || []),
                    tx.pure.vector("u8", formData.contactHash || []),
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
                    // For employer, join address lines
                    tx.pure.string([formData.addressLine1, formData.addressLine2, formData.addressLine3].filter(Boolean).join(', ')),
                    tx.pure.string(formData.portfolio[0] || ""), // Website - explicit check for empty
                    tx.pure.string(formData.pictureUrl), // Logo URL
                    tx.pure.string(formData.tax_id), // Tax ID
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
        } catch (e: unknown) {
            console.error("Error in handleSubmit:", e);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            alert(`An error occurred: ${(e as any).message}`);
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
                <div className="container mx-auto max-w-4xl">
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
                                    <p className="text-zinc-400 mb-4">You haven&apos;t created any profiles yet.</p>
                                    <Button onClick={handleCreateNew} variant="secondary">
                                        Create Your First Profile
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
                                Manage your {formData.role} profile.
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


                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Full Name or Company Name" required />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Bio</label>
                                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Brief bio..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Image URL</label>
                                        <input type="url" name="pictureUrl" value={formData.pictureUrl} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="https://..." />
                                    </div>

                                    {/* Tax ID for Employer */}
                                    {formData.role === 'employer' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">Tax ID</label>
                                            <input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="e.g. 1234567890" />
                                        </div>
                                    )}

                                    {/* Location / Address */}
                                    <div className="md:col-span-2">
                                        {formData.role === 'candidate' ? (
                                            <>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-zinc-300">Location</label>
                                                    <button type="button" onClick={() => handleToggle('locationPrivate')} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
                                                        <div className={`w-6 h-3 rounded-full relative transition-colors ${formData.locationPrivate ? 'bg-primary' : 'bg-zinc-600'}`}>
                                                            <div className={`absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full transition-transform ${formData.locationPrivate ? 'translate-x-3' : 'translate-x-0'}`} />
                                                        </div>
                                                        {formData.locationPrivate ? 'Private' : 'Public'}
                                                    </button>
                                                </div>
                                                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="City, Country" />
                                            </>
                                        ) : (
                                            <div className="space-y-3">
                                                <label className="block text-sm font-medium text-zinc-300">Address (Public)</label>
                                                <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Street Address" />
                                                <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="Apartment, Suite, Unit, etc." />
                                                <input type="text" name="addressLine3" value={formData.addressLine3} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" placeholder="City, Zip Code, Country" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Nationalities with Toggle - Only for Candidate */}
                                    {formData.role === 'candidate' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-sm font-medium text-zinc-300">Nationalities</label>
                                                <button type="button" onClick={() => handleToggle('nationalitiesPrivate')} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
                                                    <div className={`w-6 h-3 rounded-full relative transition-colors ${formData.nationalitiesPrivate ? 'bg-primary' : 'bg-zinc-600'}`}>
                                                        <div className={`absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full transition-transform ${formData.nationalitiesPrivate ? 'translate-x-3' : 'translate-x-0'}`} />
                                                    </div>
                                                    {formData.nationalitiesPrivate ? 'Private' : 'Public'}
                                                </button>
                                            </div>

                                            <input type="text" value={newNationality} onChange={e => setNewNationality(e.target.value)} onKeyDown={handleAddNationality} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Add nationality and press Enter" />
                                            <div className="flex flex-wrap gap-2">
                                                {formData.nationalities.map(n => (
                                                    <span key={n} className="bg-white/10 px-3 py-1 rounded-full text-sm text-zinc-300 flex items-center gap-2">
                                                        {n} <button type="button" onClick={() => handleRemoveNationality(n)} className="hover:text-white">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>


                                {/* Skills Section - Previous implementation */}
                                {formData.role === 'candidate' && (
                                    <div className="space-y-4 pt-6 border-t border-white/10">
                                        <h3 className="text-lg font-bold text-white">Skills</h3>
                                        <div className="flex gap-2">
                                            <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={handleAddSkill} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Add a skill and press Enter" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.skills.map(s => (
                                                <span key={s} className="bg-white/10 px-3 py-1 rounded-full text-sm text-zinc-300 flex items-center gap-2">
                                                    {s} <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-white">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                {/* Contact Info & Portfolio */}
                                <div className="space-y-4 pt-6 border-t border-white/10">
                                    <h3 className="text-lg font-bold text-white">Contact & Links</h3>
                                    <div>

                                        <label className="block text-sm font-medium text-zinc-300 mb-2">{formData.role === 'candidate' ? 'Portfolio URLs' : 'Website'}</label>

                                        {formData.role === 'employer' ? (
                                            // Employer usually has one website, but if we want to support multiple for consistency we can, 
                                            // but let's stick to the plan which was focused on Candidate.
                                            // Actually, Employer struct (viewed in types.ts not file but usually) has website: string.
                                            // Page line 154: portfolio: employerFields.website.
                                            // But wait, we changed formData.portfolio to string[].
                                            // Employer logic needs adjustment too if we share the state!
                                            // EmployerProfile has website: string.
                                            // So for employer, we should probably take valid index 0 or handle it differently.
                                            // Simplest: If employer, show single input that updates portfolio[0].
                                            <input
                                                type="url"
                                                value={formData.portfolio[0] || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, portfolio: [e.target.value] }))}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white"
                                                placeholder="https://..."
                                            />
                                        ) : (
                                            // Candidate - Multiple Links
                                            <div className="space-y-4">
                                                <input
                                                    type="url"
                                                    value={newPortfolioLink}
                                                    onChange={e => setNewPortfolioLink(e.target.value)}
                                                    onKeyDown={handleAddPortfolio}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white"
                                                    placeholder="Add portfolio link and press Enter"
                                                />
                                                <div className="flex flex-col gap-2">
                                                    {formData.portfolio.map((link, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                                                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 flex-1 truncate">{link}</a>
                                                            <button type="button" onClick={() => handleRemovePortfolio(link)} className="text-zinc-500 hover:text-white">×</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4">
                                        <label className="block text-sm font-medium text-zinc-300 mb-2">Contact Methods</label>
                                        <input type="text" value={newContact} onChange={e => setNewContact(e.target.value)} onKeyDown={handleAddContact} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Type: Value (e.g. Email: me@email.com) + Enter" />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.contactInfo.map((c, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5">
                                                    <span className="text-sm text-zinc-300">{c.value}</span>
                                                    <button type="button" onClick={() => handleToggleContactPrivacy(c.value)} className={`w-3 h-3 rounded-full ${c.isPrivate ? 'bg-primary' : 'bg-zinc-600'}`} title="Toggle Privacy" />
                                                    <button type="button" onClick={() => handleRemoveContact(c.value)} className="hover:text-white ml-1">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>


                                {/* New Detailed Fields for Candidates */}
                                {formData.role === 'candidate' && (
                                    <>
                                        {/* Languages */}
                                        <div className="space-y-4 pt-6 border-t border-white/10">
                                            <h3 className="text-lg font-bold text-white">Languages</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Select
                                                    value={newLanguage.language}
                                                    onChange={(val) => setNewLanguage({ ...newLanguage, language: val })}
                                                    options={['', ...LANGUAGES]}
                                                    placeholder="Select Language"
                                                    className="w-full"
                                                />
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={newLanguage.proficiency}
                                                        onChange={(val) => setNewLanguage({ ...newLanguage, proficiency: val })}
                                                        options={PROFICIENCY_OPTIONS}
                                                        className="flex-1"
                                                    />
                                                    <Button type="button" onClick={handleAddLanguage} className="py-2">Add</Button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {formData.languages.map((l, i) => (
                                                    <div key={i} className="flex justify-between bg-white/5 p-3 rounded-lg">
                                                        <span>{l.language} - <span className="text-zinc-400">{l.proficiency}</span></span>
                                                        <button type="button" onClick={() => handleRemoveLanguage(i)} className="text-red-400">Remove</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Education */}
                                        <div className="space-y-4 pt-6 border-t border-white/10">
                                            <h3 className="text-lg font-bold text-white">Education</h3>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={newEducation.institution}
                                                    onChange={e => setNewEducation({ ...newEducation, institution: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                                                    placeholder="Institution (e.g., MIT, Harvard)"
                                                />
                                                <input
                                                    type="text"
                                                    value={newEducation.course}
                                                    onChange={e => setNewEducation({ ...newEducation, course: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                                                    placeholder="Course/Program (e.g., Computer Science)"
                                                />
                                                <input
                                                    type="text"
                                                    value={newEducation.degree}
                                                    onChange={e => setNewEducation({ ...newEducation, degree: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                                                    placeholder="Degree/Level (e.g., Bachelor's, Master's, PhD)"
                                                />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        type="text"
                                                        value={newEducation.start_date}
                                                        onChange={e => setNewEducation({ ...newEducation, start_date: e.target.value })}
                                                        className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                                                        placeholder="Start (e.g., 2020-09)"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={newEducation.end_date}
                                                        onChange={e => setNewEducation({ ...newEducation, end_date: e.target.value })}
                                                        className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                                                        placeholder="End (e.g., 2024-06, Present)"
                                                    />
                                                </div>
                                                <Button type="button" onClick={handleAddEducation} className="w-full">Add Education</Button>
                                            </div>
                                            <div className="space-y-2">
                                                {formData.education.map((e, i) => (
                                                    <div key={i} className="flex justify-between bg-white/5 p-3 rounded-lg">
                                                        <div>
                                                            <div className="font-medium">{e.degree} in {e.course}</div>
                                                            <div className="text-sm text-zinc-400">{e.institution} • {e.start_date} - {e.end_date}</div>
                                                        </div>
                                                        <button type="button" onClick={() => handleRemoveEducation(i)} className="text-red-400">Remove</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Certificates */}
                                        <div className="space-y-4 pt-6 border-t border-white/10">
                                            <h3 className="text-lg font-bold text-white">Certificates</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <input type="text" value={newCertificate.name} onChange={e => setNewCertificate({ ...newCertificate, name: e.target.value })} className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Certificate Name" />
                                                <input type="text" value={newCertificate.link} onChange={e => setNewCertificate({ ...newCertificate, link: e.target.value })} className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white" placeholder="Link (Optional)" />
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={newCertificate.date.toString()}
                                                        onChange={(val) => setNewCertificate({ ...newCertificate, date: Number(val) })}
                                                        options={YEAR_OPTIONS.map(String)}
                                                        className="flex-1"
                                                    />
                                                    <Button type="button" onClick={handleAddCertificate} className="py-2">Add</Button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {formData.certificates.map((c, i) => (
                                                    <div key={i} className="flex justify-between bg-white/5 p-3 rounded-lg">
                                                        <span>{c.name} ({c.date}) {c.link && <a href={c.link} target="_blank" className="text-primary text-xs ml-2">View</a>}</span>
                                                        <button type="button" onClick={() => handleRemoveCertificate(i)} className="text-red-400">Remove</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rates and Engagement */}
                                        <div className="space-y-4 pt-6 border-t border-white/10">
                                            <h3 className="text-lg font-bold text-white">Rates & Engagement</h3>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Hourly Rate</label>
                                                    <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" required />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-300 mb-2">Preferred Currency</label>
                                                    <select name="preferredCurrency" value={formData.preferredCurrency} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white">
                                                        <option value="SUI">SUI</option>
                                                        <option value="USDC">USDC</option>
                                                    </select>
                                                </div>

                                                {/* Emergency Rate */}
                                                <div className="col-span-2 md:col-span-1">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="block text-sm font-medium text-zinc-300">Emergency Rate</label>
                                                        <button type="button" onClick={() => handleToggle('emergencyRateEnabled')} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
                                                            <div className={`w-6 h-3 rounded-full relative transition-colors ${formData.emergencyRateEnabled ? 'bg-primary' : 'bg-zinc-600'}`}>
                                                                <div className={`absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full transition-transform ${formData.emergencyRateEnabled ? 'translate-x-3' : 'translate-x-0'}`} />
                                                            </div>
                                                            {formData.emergencyRateEnabled ? 'Enabled' : 'Disabled'}
                                                        </button>
                                                    </div>
                                                    <input type="number" name="emergencyRate" value={formData.emergencyRate} onChange={handleChange} disabled={!formData.emergencyRateEnabled} className={`w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white ${!formData.emergencyRateEnabled && 'opacity-50 cursor-not-allowed'}`} placeholder="Optional" />
                                                </div>

                                                {/* Minimum Engagement */}
                                                <div className="col-span-2 md:col-span-1">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="block text-sm font-medium text-zinc-300">Min. Engagement (Hours)</label>
                                                        <button type="button" onClick={() => handleToggle('minimalEngagementTimeEnabled')} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
                                                            <div className={`w-6 h-3 rounded-full relative transition-colors ${formData.minimalEngagementTimeEnabled ? 'bg-primary' : 'bg-zinc-600'}`}>
                                                                <div className={`absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full transition-transform ${formData.minimalEngagementTimeEnabled ? 'translate-x-3' : 'translate-x-0'}`} />
                                                            </div>
                                                            {formData.minimalEngagementTimeEnabled ? 'Enabled' : 'Disabled'}
                                                        </button>
                                                    </div>
                                                    <input type="number" name="minimalEngagementTime" value={formData.minimalEngagementTime} onChange={handleChange} disabled={!formData.minimalEngagementTimeEnabled} className={`w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white ${!formData.minimalEngagementTimeEnabled && 'opacity-50 cursor-not-allowed'}`} placeholder="Optional" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-4 pt-8">
                                    <Button type="submit" variant="primary" className="flex-1 py-4 text-lg">
                                        {existingProfileId ? 'Update Profile' : 'Update Profile'}
                                    </Button>
                                    <Button type="button" onClick={() => setViewMode('list')} variant="secondary" className="flex-1 py-4 text-lg">
                                        Cancel
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
