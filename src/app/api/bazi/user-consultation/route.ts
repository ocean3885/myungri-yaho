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
        subjects?: Array<{ personId?: string; result?: BaziResult; subjectName?: string; birthParams?: BaziResult['birth_params'] }>;
        consultationType?: string;
        paymentId?: string;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { message: '요청 형식이 올바르지 않습니다.' },
            { status: 400 },
        );
    }

    if (!body.subjects?.[0]?.result?.four_pillars) {
        return NextResponse.json(
            { message: '사주 원국 정보가 없습니다.' },
            { status: 400 },
        );
    }

    try {
        const requestDateKst = getKstDateString();
        const adminSupabase = await createAdminClient();
        const [consultationType, userResult] = await Promise.all([
            getConsultationTypeByKey(adminSupabase, body.consultationType),
            adminSupabase.from('users').select('role').eq('id', user.id).maybeSingle(),
        ]);

        if (!consultationType.enabled) {
            return NextResponse.json(
                { message: '현재 사용할 수 없는 상담종류입니다.' },
                { status: 400 },
            );
        }

        if (body.subjects.length !== consultationType.subjectCount) {
            return NextResponse.json({ message: `이 상담은 ${consultationType.subjectCount}명의 사주 정보가 필요합니다.` }, { status: 400 });
        }
        const requestedPersonIds = body.subjects.map((subject) => subject.personId).filter((id): id is string => Boolean(id));
        if (new Set(requestedPersonIds).size !== requestedPersonIds.length) {
            return NextResponse.json({ message: '같은 인물을 중복해서 선택할 수 없습니다.' }, { status: 400 });
        }
        const { data: savedPeople } = requestedPersonIds.length > 0
            ? await adminSupabase.from('people').select('id, name, birth_params, bazi_result').eq('user_id', user.id).in('id', requestedPersonIds)
            : { data: [] };
        const savedPeopleById = new Map((savedPeople || []).map((person) => [person.id, person]));
        if (savedPeopleById.size !== requestedPersonIds.length) {
            return NextResponse.json({ message: '선택한 인물 정보를 확인할 수 없습니다.' }, { status: 400 });
        }
        const subjects = body.subjects.map((subject) => {
            const savedPerson = subject.personId ? savedPeopleById.get(subject.personId) : null;
            return {
                personId: savedPerson?.id || null,
                subjectName: normalizeSubjectName(savedPerson?.name || subject.subjectName) || '이름 없는 인물',
                birthParams: savedPerson?.birth_params || subject.birthParams,
                result: (savedPerson?.bazi_result || subject.result) as BaziResult,
            };
        });
        if (subjects.some((subject) => !subject.result?.four_pillars || !subject.birthParams)) {
            return NextResponse.json({ message: '상담 대상의 사주 정보가 올바르지 않습니다.' }, { status: 400 });
        }
        const primarySubject = subjects[0];
        const subjectName = subjects.map((subject) => subject.subjectName).join(' × ');
        const promptSubjects = subjects.map((subject) => ({ subjectName: subject.subjectName, result: subject.result }));
        const prompt = await buildBaziPrompt(adminSupabase, primarySubject.result, consultationType, promptSubjects);
        const priceKrw = consultationType.priceKrw ?? 990;
        const isAdmin = userResult.data?.role === 'admin';
        let paymentOrderId: string | null = null;
        if (!isAdmin && priceKrw > 0) {
            if (!body.paymentId) return NextResponse.json({ message: '상담 결제정보가 없습니다.' }, { status: 402 });
            const { data: paymentOrder } = await adminSupabase
                .from('consultation_payment_orders')
                .select('id, status, price_krw, consultation_type_key')
                .eq('payment_id', body.paymentId)
                .eq('user_id', user.id)
                .maybeSingle();
            if (!paymentOrder || paymentOrder.status !== 'paid' || paymentOrder.price_krw !== priceKrw || paymentOrder.consultation_type_key !== consultationType.key) {
                return NextResponse.json({ message: '유효한 상담 결제를 확인할 수 없습니다.' }, { status: 402 });
            }
            paymentOrderId = paymentOrder.id;
        }
        const { data: consultation, error: insertError } = await adminSupabase
            .from('user_consultations')
            .insert({
                user_id: user.id,
                subject_name: subjectName,
                request_date_kst: requestDateKst,
                consultation_type_key: consultationType.key,
                prompt_setting_key: consultationType.promptSettingKey,
                bazi_result: {
                    ...primarySubject.result,
                    birth_params: primarySubject.birthParams,
                },
                prompt,
                result_text: null,
                status: 'pending',
                payment_order_id: paymentOrderId,
            })
            .select('id')
            .single();

        if (insertError) {
            throw insertError;
        }

        const { error: subjectsInsertError } = await adminSupabase.from('consultation_subjects').insert(subjects.map((subject, index) => ({
            consultation_id: consultation.id,
            person_id: subject.personId,
            position: index + 1,
            subject_name: subject.subjectName,
            birth_params: subject.birthParams,
            bazi_result: { ...subject.result, birth_params: subject.birthParams },
        })));
        if (subjectsInsertError) {
            await adminSupabase.from('user_consultations').delete().eq('id', consultation.id);
            throw subjectsInsertError;
        }

        if (paymentOrderId) {
            const { error: orderUpdateError } = await adminSupabase
                .from('consultation_payment_orders')
                .update({ status: 'used', used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                .eq('id', paymentOrderId)
                .eq('status', 'paid');
            if (orderUpdateError) console.error('Consultation payment order linkage failed:', orderUpdateError);
        }

        after(async () => {
            await generateAndStoreBaziInterpretation({
                consultationId: consultation.id,
                result: primarySubject.result,
                subjects: promptSubjects,
                consultationType: consultationType.key,
                revalidatePaths: ['/profile', '/my/bazi-consultations'],
            });
        });

        return NextResponse.json({
            message: '상담 신청이 접수되었습니다. 해설은 분석이 완료되는 대로 보관함에 표시됩니다.',
            id: consultation.id,
            paidAmount: isAdmin ? 0 : priceKrw,
        });
    } catch (error) {
        console.error('Free bazi consultation failed:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : '상담 신청에 실패했습니다.' },
            { status: 502 },
        );
    }
}
