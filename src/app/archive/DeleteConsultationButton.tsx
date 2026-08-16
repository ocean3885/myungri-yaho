'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';

import { deleteArchivedConsultation } from './actions';

type DeleteConsultationButtonProps = {
    consultationId: string;
    subjectName: string;
};

export function DeleteConsultationButton({ consultationId, subjectName }: DeleteConsultationButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (isPending) return;

        const confirmed = window.confirm(`${subjectName} 상담 기록을 삭제할까요?`);
        if (!confirmed) return;

        startTransition(async () => {
            const result = await deleteArchivedConsultation(consultationId);

            if (!result.ok) {
                window.alert(result.message);
                return;
            }

            router.refresh();
        });
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#a05738] transition hover:bg-[#fff2ec] disabled:cursor-wait disabled:opacity-50"
            aria-label={`${subjectName} 상담 기록 삭제`}
            title="삭제"
        >
            {isPending ? (
                <span className="text-[11px] font-semibold">...</span>
            ) : (
                <Trash2 className="h-4 w-4" strokeWidth={2} />
            )}
        </button>
    );
}
