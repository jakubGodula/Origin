import { Suspense } from 'react';
import { EditJobClient } from './EditJobClient';

export default function EditJobPage() {
    return (
        <Suspense fallback={<div className="text-white text-center pt-24">Loading editor...</div>}>
            <EditJobClient />
        </Suspense>
    );
}
