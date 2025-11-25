import React from 'react';
import { Button } from './Button';

interface CandidateCardProps {
    name: string;
    role: string;
    rate: string;
    skills: string[];
    bio: string;
    imageUrl?: string;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
    name,
    role,
    rate,
    skills,
    bio,
    imageUrl
}) => {
    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-white/[0.07] group">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-bold text-xl">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    name.charAt(0)
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                    {name}
                                </h3>
                                <p className="text-sm text-zinc-400">{role}</p>
                            </div>
                        </div>
                        <span className="text-primary font-mono font-bold text-lg md:hidden">
                            {rate} SUI/hr
                        </span>
                    </div>

                    <p className="text-zinc-400 mb-4 line-clamp-2 mt-4">
                        {bio}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {skills.map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-zinc-300 border border-white/5"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-4 min-w-[140px]">
                    <span className="hidden md:block text-primary font-mono font-bold text-xl">
                        {rate} SUI/hr
                    </span>

                    <Button className="w-full">
                        Contact
                    </Button>
                </div>
            </div>
        </div>
    );
};
