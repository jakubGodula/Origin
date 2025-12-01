export interface ContactItem {
    value: string;
    is_private: boolean;
}

export interface CandidateProfile {
    id: {
        id: string;
    };
    name: string;
    bio: string;
    portfolio_link: string;
    skills: string[];
    location: string;
    nationality: string;
    preferred_currency: string;
    picture_url: string;
    location_private: boolean;
    nationality_private: boolean;
    contact_info: ContactItem[];
    hourly_rate: string;
    emergency_rate: {
        type: string;
        fields: {
            value: string;
        }
    } | null;
    minimal_engagement_time: {
        type: string;
        fields: {
            value: string;
        }
    } | null;
    owner: string;
    status: number;
}
