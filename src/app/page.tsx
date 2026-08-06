import React from 'react';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';
import HomeClient from './HomeClient';

type ConsultationItem = {
    id: string;
    subject_name: string;
    status: string;
    request_date_kst: string;
    result_text?: string;
};

export default async function Home() {
    const session = await auth();
    const user = session?.user || null;
    let initialConsultations: ConsultationItem[] = [];

    if (user?.id) {
        try {
            const adminSupabase = await createAdminClient();
            const { data: consultations, error: consultationError } = await adminSupabase
                .from('user_consultations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!consultationError && consultations) {
                initialConsultations = consultations.map((item) => ({
                    id: item.id,
                    subject_name: item.subject_name,
                    status: item.status,
                    request_date_kst: item.request_date_kst,
                    result_text: item.result_text,
                }));
            }
        } catch (error) {
            console.error('Failed to load initial consultations:', error);
        }
    }

    return (
        <HomeClient
            user={user}
            initialConsultations={initialConsultations}
        />
    );
}
