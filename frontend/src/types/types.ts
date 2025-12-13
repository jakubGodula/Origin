export interface ContactItem {
    value: string;
    is_private: boolean;
}

export interface Language {
    language: string;
    proficiency: string;
}

export interface Education {
    institution: string;  // Institution name
    course: string;       // Course/Program name
    degree: string;       // Degree/Level (e.g., Bachelor's, Master's, PhD)
    start_date: string;   // Start date (e.g., "2020-09")
    end_date: string;     // End date (e.g., "2024-06" or "Present")
}

export interface Certificate {
    name: string;
    link: string;
    date: number;
}

export interface CandidateProfile {
    id: {
        id: string;
    };
    name: string;
    bio: string;
    portfolio: string[];
    skills: string[];
    location: string;
    nationalities: string[];
    preferred_currency: string;
    picture_url: string;
    location_private: boolean;
    nationalities_private: boolean;
    contact_info: ContactItem[];

    // New fields
    languages: Language[];
    education: Education[]; // Note: fields object wrapper might be needed if standard JSON RPC structure
    certificates: Certificate[];

    // Hashed privacy fields
    location_hash?: { type: string; fields: { vec: number[] } } | null;
    nationalities_hash?: { type: string; fields: { vec: number[] } } | null;
    contact_hash?: { type: string; fields: { vec: number[] } } | null;
    hourly_rate: string;
    emergency_rate: {
        type: string;
        fields: {
            vec: string[];
        }
    } | null;
    minimal_engagement_time: {
        type: string;
        fields: {
            vec: string[];
        }
    } | null;
    owner: string;
    status: number;
}

export interface EmployerProfile {
    id: {
        id: string;
    };
    name: string;
    bio: string;
    location: string;
    website: string;
    logo_url: string;
    contact_info: ContactItem[];
    owner: string;
    status: number;
    tax_id: string;
}

export interface ReputationProfile {
    id: {
        id: string;
    };
    user: string;
    total_jobs: string;
    completed_jobs: string;
    total_rating: string;
    rating_count: string;
    badges: number[]; // vector<u8> usually comes as number[] or string? checking Move... vector<u8> often base64 or array. 
    skill_scores: {
        type: string;
        fields: {
            contents: {
                key: string;
                value: string;
            }[];
        };
    };
    skill_counts: {
        type: string;
        fields: {
            contents: {
                key: string;
                value: string;
            }[];
        };
    };
}
