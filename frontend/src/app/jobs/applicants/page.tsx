import { Suspense } from 'react';
import { JobApplicantsClient } from './JobApplicantsClient';

export default function JobApplicantsPage() {
    return (
        <Suspense fallback={<div className="text-white text-center pt-24">Loading applicants...</div>}>
            <JobApplicantsClient />
        </Suspense>
    );
}
