import Link from 'next/link';
import { Archive, ChevronRight, FileText, LogIn } from 'lucide-react';

import { auth } from '@/auth';
import { DeleteConsultationButton } from '@/app/archive/DeleteConsultationButton';
import {
    formatKstDate,
    getConsultationTitle,
    getResultPreview,
    getStatusClassName,
    getStatusLabel,
} from '@/lib/archive-format';
import { createAdminClient } from '@/utils/supabase/server';

type ConsultationItem = {
    id: string;
    subject_name: string | null;
    status: string;
    request_date_kst: string;
    result_text: string | null;
    prompt_version: string | null;
    consultation_type_key: string | null;
    prompt_setting_key: string | null;
    created_at: string;
};

export default async function ArchivePage() {
    const session = await auth();

    if (!session?.user?.id) {
        return (
            <section className="pt-6">
                <div className="rounded-[12px] border border-[#ead8c6] bg-white px-5 py-6 shadow-[0_12px_32px_rgba(92,61,25,0.06)]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1e6db] text-[#7d5a36]">
                        <Archive className="h-6 w-6" strokeWidth={1.8} />
                    </span>
                    <h1 className="mt-4 text-[22px] font-semibold text-[#171553]">보관함</h1>
                    <p className="mt-2 break-keep text-[14px] leading-[1.65] text-[#66594d]">
                        로그인 후 상담했던 결과물을 모아볼 수 있어요.
                    </p>
                    <Link
                        href="/auth/signin"
                        className="font-display mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#191450] text-[15px] font-medium text-white transition hover:bg-[#24206a]"
                    >
                        <LogIn className="h-4 w-4" strokeWidth={2} />
                        로그인
                    </Link>
                </div>
            </section>
        );
    }

    let consultations: ConsultationItem[] = [];

    try {
        const adminSupabase = await createAdminClient();
        const { data, error } = await adminSupabase
            .from('user_consultations')
            .select('id, subject_name, status, request_date_kst, result_text, prompt_version, consultation_type_key, prompt_setting_key, created_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        consultations = data || [];
    } catch (error) {
        console.error('Failed to load archived consultations:', error);
    }

    return (
        <section className="pt-2">
            <div className="mb-5">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#b06b16]">
                    <Archive className="h-4 w-4" strokeWidth={2} />
                    상담 기록
                </p>
                <h1 className="mt-1 text-[24px] font-semibold text-[#171553]">보관함</h1>
                <p className="mt-2 break-keep text-[14px] leading-[1.65] text-[#66594d]">
                    완료된 상담과 진행 중인 상담을 한곳에서 확인할 수 있어요.
                </p>
            </div>

            {consultations.length > 0 ? (
                <div className="space-y-3">
                    {consultations.map((item) => {
                        const subjectName = item.subject_name || '이름 없는 상담';

                        return (
                            <article
                                key={item.id}
                                className="rounded-[12px] border border-[#ead8c6] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(92,61,25,0.055)] transition hover:border-[#dfc5aa] hover:bg-[#fffaf4]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <Link href={`/archive/${item.id}`} className="min-w-0 flex-1">
                                        <p className="truncate text-[17px] font-semibold text-[#171553]">
                                            {subjectName} · {getConsultationTitle(item.prompt_version, item.consultation_type_key)}
                                        </p>
                                        <p className="mt-1 text-[12px] text-[#8a7a68]">
                                            {formatKstDate(item.request_date_kst)}
                                        </p>
                                    </Link>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(item.status)}`}>
                                            {getStatusLabel(item.status)}
                                        </span>
                                        <DeleteConsultationButton consultationId={item.id} subjectName={subjectName} />
                                    </div>
                                </div>
                                <Link href={`/archive/${item.id}`} className="block">
                                    <p className="mt-3 line-clamp-2 break-keep text-[13px] leading-[1.6] text-[#555555]">
                                        {item.status === 'failed' ? '상담 생성에 실패했습니다. 상세에서 상태를 확인해주세요.' : getResultPreview(item.result_text)}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between border-t border-[#f0e4d8] pt-3 text-[#171553]">
                                        <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                                            <FileText className="h-4 w-4" strokeWidth={2} />
                                            상세 보기
                                        </span>
                                        <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
                                    </div>
                                </Link>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-[12px] border border-dashed border-[#e5d2bd] bg-white px-5 py-10 text-center">
                    <Archive className="mx-auto h-9 w-9 text-[#b06b16]" strokeWidth={1.8} />
                    <h2 className="mt-3 text-[18px] font-semibold text-[#171553]">아직 보관된 상담이 없어요</h2>
                    <p className="mt-2 break-keep text-[13px] leading-[1.65] text-[#66594d]">
                        인물 페이지에서 사주 정보를 확인한 뒤 기본 상담을 신청해보세요.
                    </p>
                    <Link
                        href="/people"
                        className="font-display mt-5 flex h-11 w-full items-center justify-center rounded-[9px] bg-[#191450] text-[14px] font-medium text-white transition hover:bg-[#24206a]"
                    >
                        상담 신청하기
                    </Link>
                </div>
            )}
        </section>
    );
}
