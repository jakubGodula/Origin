import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { PACKAGE_ID, MODULE_NAME } from '../utils/constants';

export interface Skill {
    name: string;
    years_experience: number;
}

export interface Job {
    id: string;
    title: string;
    description: string;
    details: string;
    required_skills: Skill[];
    price: string;
    paymentType: number;
    durationValue: number;
    durationUnit: number;
    location: string;
    locationRequired: boolean;
    tags: string[];
    postedBy: string;
    postedAt: string;
    deadline: string; // Added deadline
    status: number;
    applicantCount: number;
    job_version: number;
    language: string; // Added language
}

import { getRelativeTime } from '@/utils/format';

export function useJobs() {
    const client = useSuiClient();

    return useQuery({
        queryKey: ['jobs'],
        queryFn: async (): Promise<Job[]> => {
            // 1. Fetch JobCreated events (Note: Filter logic might need better indexing in production)
            const events = await client.queryEvents({
                query: {
                    MoveModule: {
                        package: PACKAGE_ID,
                        module: MODULE_NAME,
                    },
                },
                order: 'descending',
            });

            // Filter for JobCreated events
            const jobCreatedEvents = events.data.filter(
                (event) => event.type.includes('::JobCreated')
            );

            if (jobCreatedEvents.length === 0) {
                return [];
            }

            // 2. Get the object IDs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const jobIds = jobCreatedEvents.map((event) => (event.parsedJson as any).job_id);

            // 3. Fetch the objects to get full details (description, status, etc.)
            const objects = await client.multiGetObjects({
                ids: jobIds,
                options: {
                    showContent: true,
                },
            });

            // 4. Map to Job interface
            const jobs = objects.map((obj, index) => { // eslint-disable-line @typescript-eslint/no-unused-vars
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const content = obj.data?.content as any;
                if (!content || content.dataType !== 'moveObject') return null;

                const fields = content.fields;

                // Parse skills
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const skills = (fields.required_skills || []).map((s: any) => ({
                    name: s.fields.name,
                    years_experience: s.fields.years_experience
                }));

                return {
                    id: fields.id.id,
                    title: fields.title,
                    description: fields.description,
                    details: fields.details,
                    required_skills: skills,
                    price: (Number(fields.budget) / 1_000_000_000).toString(), // Convert MIST to SUI
                    paymentType: fields.payment_type,
                    durationValue: fields.duration_value,
                    durationUnit: fields.duration_unit,
                    location: fields.location,
                    locationRequired: fields.location_required,
                    tags: fields.tags as string[],
                    postedBy: fields.poster,
                    postedAt: getRelativeTime(Number(fields.created_at)),
                    deadline: new Date(Number(fields.deadline)).toLocaleDateString(),
                    status: Number(fields.status), // Ensure status is valid number
                    applicantCount: Number(fields.applicant_count || 0),
                    job_version: Number(fields.job_version || 0),
                    language: fields.language || 'English', // Map language, default to English if missing (migration safety)
                };
            }).filter((job): job is Job => job !== null);

            return jobs;
        },
    });
}
