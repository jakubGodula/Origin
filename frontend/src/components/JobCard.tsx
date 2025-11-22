"use client";

import React from 'react';
import { Button } from './Button';
import Link from 'next/link';

interface JobCardProps {
    id: number;
    title: string;
    description: string;
    price: string;
    tags: string[];
    postedBy: string;
    postedAt: string;
}

export const JobCard: React.FC<JobCardProps> = ({
    id,
    title,
    description,
    price,
    tags,
    postedBy,
    postedAt
}) => {
    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:bg-white/[0.07] group">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        <span className="text-primary font-mono font-bold text-lg md:hidden">
                            {price} SUI
                        </span>
                    </div>

                    <p className="text-zinc-400 mb-4 line-clamp-2">
                        {description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-zinc-300 border border-white/5"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span>Posted by <span className="text-zinc-300">{postedBy}</span></span>
                        <span>•</span>
                        <span>{postedAt}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-4 min-w-[140px]">
                    <span className="hidden md:block text-primary font-mono font-bold text-xl">
                        {price} SUI
                    </span>

                    <Link href={`/jobs/view?id=${id}`} className="w-full md:w-auto">
                        <Button className="w-full">
                            View Details
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
