import React from 'react';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';
import { calculateDailyFortune } from '@/lib/fortune-calculator';
import HomeClient from './HomeClient';

export default async function Home() {
    const session = await auth();
    const user = session?.user || null;
    let initialConsultations: any[] = [];
    let fortuneData = undefined;

    if (user?.id) {
        if (user.email) {
            fortuneData = calculateDailyFortune(user.email);
        }
        
        try {
            const adminSupabase = await createAdminClient();
            const { data, error } = await adminSupabase
                .from('user_consultations')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!error && data) {
                initialConsultations = data.map((item) => ({
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
            fortuneData={fortuneData}
        />
    );
}
