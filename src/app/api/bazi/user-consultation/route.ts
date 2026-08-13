import { after, NextRequest, NextResponse } from 'next/server';
import type { BaziResult } from '@/components/bazi/types';
import { createAdminClient } from '@/utils/supabase/server';
import { auth } from '@/auth';
import { getConsultationTypeByKey } from '@/lib/consultation-types';
import {
    buildBaziPrompt,
    generateAndStoreBaziInterpretation,
    getKstDateString,
    normalizeSubjectName,
} from '@/lib/bazi-consultation';

export async function POST(request: NextRequest) {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return NextResponse.json(
            { message: '회원 로그인 후 신청할 수 있습니다.' },
            { status: 401 },
        );
    }

    if (!process.env.DEEPSEEK_API_KEY) {
        return NextResponse.json(
            { message: '해설 생성 API 키가 설정되어 있지 않습니다.' },
            { status: 500 },
        );
    }

    let body: {
        result?: BaziResult;
        subjectName?: string;
        birthParams?: BaziResult['birth_params'];
        consultationType?: string;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { message: '요청 형식이 올바르지 않습니다.' },
            { status: 400 },
        );
    }

    if (!body.result?.four_pillars) {
        return NextResponse.json(
            { message: '사주 원국 정보가 없습니다.' },
            { status: 400 },
        );
    }

    try {
        const requestDateKst = getKstDateString();
        const adminSupabase = await createAdminClient();
        const consultationType = await getConsultationTypeByKey(adminSupabase, body.consultationType);

        if (!consultationType.enabled) {
            return NextResponse.json(
                { message: '현재 사용할 수 없는 상담종류입니다.' },
                { status: 400 },
            );
        }

        const subjectName = normalizeSubjectName(body.subjectName);
        const prompt = await buildBaziPrompt(adminSupabase, body.result, consultationType);
        const { data: consultation, error: insertError } = await adminSupabase
            .from('user_consultations')
            .insert({
                user_id: user.id,
                subject_name: subjectName,
                request_date_kst: requestDateKst,
                consultation_type_key: consultationType.key,
                prompt_setting_key: consultationType.promptSettingKey,
                bazi_result: {
                    ...body.result,
                    birth_params: body.birthParams,
                },
                prompt,
                result_text: null,
                status: 'pending',
            })
            .select('id')
            .single();

        if (insertError) throw insertError;

        after(async () => {
            await generateAndStoreBaziInterpretation({
                consultationId: consultation.id,
                result: body.result!,
                consultationType: consultationType.key,
                revalidatePaths: ['/profile', '/my/bazi-consultations'],
            });
        });

        return NextResponse.json({
            message: '상담 신청이 접수되었습니다. 해설은 분석이 완료되는 대로 보관함에 표시됩니다.',
            id: consultation.id,
        });
    } catch (error) {
        console.error('Free bazi consultation failed:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : '상담 신청에 실패했습니다.' },
            { status: 502 },
        );
    }
}
