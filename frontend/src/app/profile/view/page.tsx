"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { Header } from '@/components/Header';
import { CandidateProfile } from '@/types/types';

function ProfileViewContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const address = searchParams.get('address'); // Keep for legacy/fallback if needed, or remove
    const router = useRouter();

    const { data: objectData, isLoading } = useSuiClientQuery(
        'getObject',
        {
            id: id || '',
            options: { showContent: true }
        },
        { enabled: !!id }
    );

    if (!id) {
        // Fallback or error if no ID
        if (address) {
            // Optional: redirect or show legacy view. For now, let's guide to use ID.
            return <div className="text-center text-zinc-500 pt-24">Profile ID is missing. Please access via the candidates list.</div>;
        }
        return <div className="text-center text-zinc-500 pt-24">No profile ID provided</div>;
    }

    if (isLoading) {
        return (
            <div className="container mx-auto px-6 pt-24 max-w-5xl">
                <div className="animate-pulse space-y-8">
                    <div className="h-64 bg-white/5 rounded-2xl w-full"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="h-32 bg-white/5 rounded-xl"></div>
                            <div className="h-32 bg-white/5 rounded-xl"></div>
                        </div>
                        <div className="h-64 bg-white/5 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    const object = objectData;

    const rawFields = object?.data?.content?.dataType === 'moveObject'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (object.data.content.fields as any)
        : null;

    console.log('Raw Profile Fields:', rawFields);

    // Helper to extract fields from vector of structs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapVectorStruct = (arr: any[]) => {
        return (arr || []).map(item => item.fields || item);
    };

    const profile: CandidateProfile | null = rawFields ? {
        ...rawFields,
        languages: mapVectorStruct(rawFields.languages),
        education: mapVectorStruct(rawFields.education),
        certificates: mapVectorStruct(rawFields.certificates),
        contact_info: mapVectorStruct(rawFields.contact_info),
        hourly_rate: rawFields.hourly_rate,
        emergency_rate: rawFields.emergency_rate,
        minimal_engagement_time: rawFields.minimal_engagement_time,
        preferred_currency: rawFields.preferred_currency,
        // Ensure arrays that are just strings (not structs) are passed through (like skills)
        skills: rawFields.skills || [],
        portfolio: rawFields.portfolio || [],
        nationalities: rawFields.nationalities || [],
    } : null;

    if (!profile) {
        return (
            <div className="container mx-auto px-6 pt-24 text-center">
                <div className="bg-white/5 border border-white/10 rounded-xl p-12 max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold text-white mb-2">Profile Not Found</h1>
                    <p className="text-zinc-400 mb-6">We could not find a candidate profile for this address.</p>
                    <button onClick={() => router.back()} className="text-primary hover:underline">Go Back</button>
                </div>
            </div>
        );
    }

    // function formatSui removed

    // Helper to extract option value safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getOptionValue = (option: any) => {
        if (option === null || option === undefined) return undefined;
        if (typeof option === 'object') {
            if ('fields' in option && 'vec' in option.fields) {
                return option.fields.vec[0];
            }
            if ('vec' in option) {
                return option.vec[0];
            }
            return undefined;
        }
        return option.toString();
    };

    const emergencyRate = getOptionValue(profile.emergency_rate);
    const minimalEngagement = getOptionValue(profile.minimal_engagement_time);

    return (
        <div className="container mx-auto px-6 max-w-5xl">
            <button onClick={() => router.back()} className="mb-6 text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                <span>←</span> Back
            </button>

            {/* Profile Header */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-blue-500/10" />

                <div className="relative flex flex-col md:flex-row items-end md:items-center gap-6 mt-8">
                    <div className="w-32 h-32 rounded-full border-4 border-[#0a0a0a] bg-black overflow-hidden shadow-xl shrink-0">
                        {profile.picture_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.picture_url} className="w-full h-full object-cover" alt={profile.name} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-white/10">👤</div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold text-white truncate">{profile.name}</h1>
                        <p className="text-zinc-400 text-lg mt-1">{profile.bio?.split('\n')[0]}</p>
                    </div>

                    <div className="flex gap-3">
                        {!profile.location_private && profile.location && (
                            <div className="bg-black/30 border border-white/5 px-4 py-2 rounded-lg text-sm text-zinc-300 flex items-center gap-2">
                                <span>📍</span> {profile.location}
                            </div>
                        )}
                        {!profile.nationalities_private && (profile.nationalities || []).length > 0 && (
                            <div className="bg-black/30 border border-white/5 px-4 py-2 rounded-lg text-sm text-zinc-300 flex items-center gap-2">
                                <span>🌍</span> {profile.nationalities.join(", ")}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* About */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            About
                        </h2>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {profile.bio || "No bio provided."}
                        </div>
                    </section>

                    {/* Skills */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                            {(profile.skills || []).map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium">
                                    {skill}
                                </span>
                            ))}
                            {(profile.skills || []).length === 0 && <span className="text-zinc-500">No skills listed.</span>}
                        </div>
                    </section>

                    {/* Experience / Education */}
                    {(profile.education || []).length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">Education</h2>
                            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
                                {profile.education.map((edu, i) => (
                                    <div key={i} className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-white font-medium text-lg">{edu.institution}</h3>
                                                <p className="text-zinc-300 font-medium">{edu.degree} in {edu.course}</p>
                                            </div>
                                            <span className="text-zinc-500 text-sm bg-white/5 px-2 py-1 rounded whitespace-nowrap">
                                                {edu.start_date} - {edu.end_date}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Certificates */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">Certificates</h2>
                        {(profile.certificates || []).length === 0 ? (
                            <div className="text-zinc-500 italic">No certificates found.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.certificates.map((cert, i) => {
                                    // Debug logging for individual cert
                                    console.log('Rendering Cert:', cert);

                                    const hasLink = cert.link && cert.link.trim() !== "";
                                    const Wrapper = hasLink ? 'a' : 'div';
                                    const props = hasLink ? {
                                        href: cert.link,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 hover:border-white/20 transition-all group cursor-pointer"
                                    } : {
                                        className: "bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group"
                                    };

                                    return (
                                        <Wrapper key={i} {...props}>
                                            <div>
                                                <h3 className={`text-white font-medium ${hasLink ? 'group-hover:text-primary transition-colors' : ''}`}>{cert.name}</h3>
                                                <p className="text-xs text-zinc-500 mt-1">Issued {cert.date}</p>
                                            </div>
                                            {hasLink && <span className="text-zinc-500 group-hover:text-white transition-colors">↗</span>}
                                        </Wrapper>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Portfolio */}
                    {(profile.portfolio || []).length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">Portfolio</h2>
                            <div className="space-y-3">
                                {profile.portfolio.map((item, i) => (
                                    <a
                                        key={i}
                                        href={item}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block bg-white/5 border border-white/10 rounded-lg p-4 text-primary hover:underline hover:bg-white/10 transition-colors"
                                    >
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Rates Card */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Rates & Availability</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="text-3xl font-bold text-white font-mono">{profile.hourly_rate} {profile.preferred_currency}</div>
                                <div className="text-sm text-zinc-500">Hourly Rate</div>
                            </div>

                            {/* Note: The 'emergency_rate' and 'minimal_engagement_time' in CandidateProfile are Objects with fields.vec 
                                We might need to handle the Option formatting if they are Option<u64> from Move. 
                                Based on types.ts: emergency_rate: { type: string; fields: { vec: string[]; } } | null;
                            */}

                            {emergencyRate && (
                                <div className="pt-4 border-t border-white/5">
                                    <div className="text-xl font-bold text-red-400 font-mono">{emergencyRate} {profile.preferred_currency}</div>
                                    <div className="text-sm text-zinc-500">Emergency Rate</div>
                                </div>
                            )}

                            {minimalEngagement && (
                                <div className="pt-4 border-t border-white/5">
                                    <div className="text-xl font-bold text-white font-mono">{Number(minimalEngagement)} Hours</div>
                                    <div className="text-sm text-zinc-500">Min. Engagement</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Languages */}
                    {(profile.languages || []).length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Languages</h3>
                            <div className="space-y-3">
                                {profile.languages.map((lang, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <span className="text-white">{lang.language}</span>
                                        <span className="text-xs text-zinc-500 uppercase border border-white/10 px-2 py-1 rounded">
                                            {lang.proficiency}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact Info (If Public) */}
                    {(profile.contact_info || []).some(c => !c.is_private) && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Contact</h3>
                            <div className="space-y-3">
                                {profile.contact_info.map((contact, i) => !contact.is_private && (
                                    <div key={i} className="flex items-center gap-3 text-zinc-300 overflow-hidden">
                                        <span className="text-lg">📧</span> {/* Placeholder icon, could be dynamic */}
                                        <span className="truncate" title={contact.value}>{contact.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default function ProfileViewPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Header />
            <main className="pt-24 pb-12">
                <Suspense fallback={<div className="text-center text-zinc-500 pt-12">Loading...</div>}>
                    <ProfileViewContent />
                </Suspense>
            </main>
        </div>
    );
}
