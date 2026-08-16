'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';

export async function deleteArchivedConsultation(consultationId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return {
            ok: false,
            message: '로그인 후 삭제할 수 있습니다.',
        };
    }

    const id = consultationId.trim();

    if (!id) {
        return {
            ok: false,
            message: '삭제할 상담을 찾지 못했습니다.',
        };
    }

    try {
        const adminSupabase = await createAdminClient();
        const { data, error } = await adminSupabase
            .from('user_consultations')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id)
            .select('id')
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return {
                ok: false,
                message: '삭제할 상담을 찾지 못했습니다.',
            };
        }

        revalidatePath('/archive');
        revalidatePath(`/archive/${id}`);

        return {
            ok: true,
            message: '상담 기록을 삭제했습니다.',
        };
    } catch (error) {
        console.error('Failed to delete archived consultation:', error);

        return {
            ok: false,
            message: '상담 기록 삭제에 실패했습니다.',
        };
    }
}
