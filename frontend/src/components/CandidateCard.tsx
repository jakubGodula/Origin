import React from 'react';
import { Button } from './Button';

interface CandidateCardProps {
    name: string;
    role: string;
    rate: string;
    currency: string;
    skills: { name: string; rating: number; count: number }[];
    bio: string;
    imageUrl?: string;
    emergencyRate?: string;
    minimalEngagementTime?: string;
    location?: string;
    nationalities?: string[];
    locationPrivate?: boolean;
    nationalitiesPrivate?: boolean;
    education?: string;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
    name,
    role,
    rate,
    currency,
    skills,
    bio,
    imageUrl,
    emergencyRate,
    minimalEngagementTime,
    location,
    nationalities,
    locationPrivate,
    nationalitiesPrivate,
    education
}) => {
    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-white/[0.07] group">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    name.charAt(0)
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                    {name}
                                </h3>
                                <p className="text-sm text-zinc-400">{role}</p>
                                {education && (
                                    <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                        <span>🎓 {education}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        <span className="text-primary font-mono font-bold text-lg md:hidden">
                            {rate} {currency}/hr
                        </span>
                    </div>

                    {/* Location & Nationalities (if public) */}
                    <div className="flex flex-wrap gap-3 mb-3 text-sm text-zinc-400">
                        {location && !locationPrivate && (
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                                <span>📍 {location}</span>
                            </div>
                        )}
                        {nationalities && nationalities.length > 0 && !nationalitiesPrivate && (
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                                <span>🗺️ {nationalities.join(", ")}</span>
                            </div>
                        )}
                    </div>

                    {/* Skills with Ratings */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {skills.map((skill, index) => (
                            <div key={index} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-xs transition-colors hover:bg-white/10 hover:border-primary/30">
                                <span className="text-zinc-200">{skill.name}</span>
                                {skill.rating > 0 && (
                                    <span className="flex items-center gap-0.5 text-yellow-400 font-medium bg-yellow-400/10 px-1.5 py-0.5 rounded-[4px] -mr-1">
                                        <span>★</span>
                                        {skill.rating.toFixed(1)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="text-zinc-400 mb-4 line-clamp-2 mt-4">
                        {bio}
                    </p>

                </div>

                <div className="flex flex-col items-end justify-between gap-4 min-w-[140px]">
                    <div className="text-right">
                        <span className="hidden md:block text-primary font-mono font-bold text-xl">
                            {rate} {currency}/hr
                        </span>

                        {/* Extra Info - Desktop & Mobile (aligned right) */}
                        <div className="flex flex-col items-end gap-1 mt-1">
                            {emergencyRate && (
                                <div className="text-xs text-red-300 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                    <span>🚨 {emergencyRate} {currency}/hr</span>
                                </div>
                            )}
                            {minimalEngagementTime && (
                                <div className="text-xs text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                    <span>⏱️ Min: {minimalEngagementTime}h</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button className="w-full">
                        Contact
                    </Button>
                </div>
            </div>
        </div>
    );
};
