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
    status: number;
}

export function useJobs() {
    const client = useSuiClient();

    return useQuery({
        queryKey: ['jobs'],
        queryFn: async (): Promise<Job[]> => {
            // 1. Fetch JobCreated events
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
            const jobIds = jobCreatedEvents.map((event) => (event.parsedJson as any).job_id);

            // 3. Fetch the objects to get full details (description, status, etc.)
            const objects = await client.multiGetObjects({
                ids: jobIds,
                options: {
                    showContent: true,
                },
            });

            // 4. Map to Job interface
            const jobs = objects.map((obj, index) => {
                const content = obj.data?.content as any;
                if (!content || content.dataType !== 'moveObject') return null;

                const fields = content.fields;

                // Status 0 = Open
                if (fields.status !== 0) return null;

                // Parse skills
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
                    status: fields.status,
                };
            }).filter((job): job is Job => job !== null);

            return jobs;
        },
    });
}

function getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    // Convert to seconds
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;

    return `${Math.floor(months / 12)}y ago`;
}
