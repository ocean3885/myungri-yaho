import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Archive, CalendarDays, ChevronLeft, Clock, FileText, LogIn, TriangleAlert } from 'lucide-react';

import { auth } from '@/auth';
import type { BaziResult, PillarKey } from '@/components/bazi/types';
import {
    formatKstDate,
    formatKstDateTime,
    getConsultationTitle,
    getStatusClassName,
    getStatusLabel,
} from '@/lib/archive-format';
import { createAdminClient } from '@/utils/supabase/server';

type ConsultationDetail = {
    id: string;
    subject_name: string | null;
    request_date_kst: string;
    bazi_result: BaziResult;
    result_text: string | null;
    status: string;
    completed_at: string | null;
    error_message: string | null;
    prompt_version: string | null;
    consultation_type_key: string | null;
    prompt_setting_key: string | null;
    created_at: string;
};

const pillarOrder: Array<{ key: PillarKey; label: string }> = [
    { key: 'time', label: '시주' },
    { key: 'day', label: '일주' },
    { key: 'month', label: '월주' },
    { key: 'year', label: '년주' },
];

export default async function ArchiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
        return (
            <section className="pt-6">
                <div className="rounded-[12px] border border-[#ead8c6] bg-white px-5 py-6 shadow-[0_12px_32px_rgba(92,61,25,0.06)]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f1e6db] text-[#7d5a36]">
                        <Archive className="h-6 w-6" strokeWidth={1.8} />
                    </span>
                    <h1 className="mt-4 text-[22px] font-semibold text-[#171553]">상담 상세</h1>
                    <p className="mt-2 break-keep text-[14px] leading-[1.65] text-[#66594d]">
                        로그인 후 보관된 상담 결과를 확인할 수 있어요.
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

    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
        .from('user_consultations')
        .select('id, subject_name, request_date_kst, bazi_result, result_text, status, completed_at, error_message, prompt_version, consultation_type_key, prompt_setting_key, created_at')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .maybeSingle();

    if (error) {
        console.error('Failed to load archived consultation detail:', error);
        notFound();
    }

    if (!data) notFound();

    const consultation = data as ConsultationDetail;
    const baziResult = consultation.bazi_result || {};

    return (
        <section className="pt-1">
            <header className="mb-5 flex h-11 items-center justify-between">
                <Link href="/archive" className="flex h-10 w-10 items-center justify-center rounded-full text-[#171553]">
                    <ChevronLeft className="h-7 w-7" strokeWidth={2.2} />
                </Link>
                <h1 className="text-[18px] font-semibold text-[#111111]">상담 상세</h1>
                <span className="h-10 w-10" />
            </header>

            <article className="overflow-hidden rounded-[12px] border border-[#ead8c6] bg-white shadow-[0_16px_38px_rgba(58,42,29,0.08)]">
                <div className="border-b border-[#eadfd4] bg-[#fffaf4] px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#b06b16]">
                                <FileText className="h-3.5 w-3.5" strokeWidth={2} />
                                {getConsultationTitle(consultation.prompt_version, consultation.consultation_type_key)}
                            </p>
                            <h2 className="mt-1 break-keep text-[22px] font-semibold leading-[1.3] text-[#171553]">
                                {consultation.subject_name || '이름 없는 상담'}
                            </h2>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(consultation.status)}`}>
                            {getStatusLabel(consultation.status)}
                        </span>
                    </div>

                    <div className="mt-4 grid gap-2 text-[13px] leading-[1.6] text-[#66594d]">
                        <p className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#b06b16]" strokeWidth={2} />
                            상담 신청일 {formatKstDate(consultation.request_date_kst)}
                        </p>
                        <p className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[#b06b16]" strokeWidth={2} />
                            {consultation.completed_at ? `완료 시각 ${formatKstDateTime(consultation.completed_at)}` : `접수 시각 ${formatKstDateTime(consultation.created_at)}`}
                        </p>
                    </div>
                </div>

                <div className="space-y-4 px-4 py-4">
                    <section className="rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
                        <h3 className="text-[15px] font-semibold text-[#2a2018]">명식</h3>
                        <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-[8px] border border-[#eadfd4] bg-white text-center">
                            {pillarOrder.map((pillar) => {
                                const value = baziResult.four_pillars?.[pillar.key];

                                return (
                                    <div key={pillar.key} className="min-w-0 border-r border-[#eadfd4] last:border-r-0">
                                        <p className="border-b border-[#eadfd4] bg-[#fffaf4] px-1 py-2 text-[12px] font-semibold text-[#65574b]">
                                            {pillar.label}
                                        </p>
                                        <p className="border-b border-[#eadfd4] py-3 text-[25px] font-semibold leading-none text-[#171553]">
                                            {formatStemOrBranch(value?.gan)}
                                        </p>
                                        <p className="py-3 text-[25px] font-semibold leading-none text-[#171553]">
                                            {formatStemOrBranch(value?.ji)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className="rounded-[10px] border border-[#eee2d6] bg-[#fffdf9] px-4 py-4">
                        <h3 className="text-[15px] font-semibold text-[#2a2018]">상담 결과</h3>
                        {consultation.status === 'completed' && consultation.result_text ? (
                            <div className="mt-3 whitespace-pre-wrap break-keep text-[14px] leading-[1.85] text-[#36302a]">
                                {consultation.result_text}
                            </div>
                        ) : consultation.status === 'failed' ? (
                            <div className="mt-3 rounded-[9px] border border-[#ffd9c8] bg-[#fff2ec] px-3 py-3 text-[13px] leading-[1.65] text-[#a05738]">
                                <p className="flex items-center gap-1.5 font-semibold">
                                    <TriangleAlert className="h-4 w-4" strokeWidth={2} />
                                    상담 생성 실패
                                </p>
                                <p className="mt-1">{consultation.error_message || '상담 생성 중 오류가 발생했습니다.'}</p>
                            </div>
                        ) : (
                            <div className="mt-3 rounded-[9px] border border-[#ead8c6] bg-[#fff8ec] px-3 py-3 text-[13px] leading-[1.65] text-[#9a6616]">
                                상담문을 생성하고 있어요. 잠시 후 다시 확인해주세요.
                            </div>
                        )}
                    </section>
                </div>
            </article>
        </section>
    );
}

function formatStemOrBranch(value?: { kr?: string; ch?: string }) {
    if (!value?.kr && !value?.ch) return '-';
    if (!value.kr) return value.ch || '-';
    if (!value.ch) return value.kr;

    return `${value.kr}\n${value.ch}`;
}
