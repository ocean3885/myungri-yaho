'use client';

import Link from 'next/link';
import { ChevronLeft, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';

import type { SavedPerson } from '../PeopleClient';

type Props = {
  initialPeople: SavedPerson[];
};

function formatSavedPersonMeta(person: SavedPerson) {
  return `${person.calendar} ${person.birthDate} ${person.birthTime || '시간 모름'} · ${person.gender}`;
}

function formatCreatedAt(value?: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export default function PeopleManageClient({ initialPeople }: Props) {
  const [people, setPeople] = useState(initialPeople);
  const [deletingPersonId, setDeletingPersonId] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [message, setMessage] = useState('');

  const handleDeletePerson = async (person: SavedPerson) => {
    if (deletingPersonId) return;

    const confirmed = window.confirm(`${person.name}님의 저장된 인물 정보를 삭제할까요?`);
    if (!confirmed) return;

    setDeletingPersonId(person.id);
    setMessageType('success');
    setMessage('');

    try {
      const response = await fetch(`/api/people?id=${encodeURIComponent(person.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '인물 정보 삭제에 실패했습니다.');
      }

      setPeople((current) => current.filter((item) => item.id !== person.id));
      setMessageType('success');
      setMessage(data.message || '인물 정보를 삭제했습니다.');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : '인물 정보 삭제에 실패했습니다.');
    } finally {
      setDeletingPersonId('');
    }
  };

  return (
    <>
      <header className="flex h-12 items-center justify-between">
        <Link href="/people" className="flex h-10 w-10 items-center justify-center rounded-full text-[#171553]" aria-label="인물 등록으로 돌아가기">
          <ChevronLeft className="h-7 w-7" strokeWidth={2.2} />
        </Link>
        <h1 className="text-[18px] font-semibold text-[#111111]">인물 관리</h1>
        <Link href="/people" className="flex h-10 w-10 items-center justify-center rounded-full text-[#171553]" aria-label="인물 등록">
          <Plus className="h-5 w-5" strokeWidth={2.2} />
        </Link>
      </header>

      <section className="mt-5 rounded-[12px] border border-[#ead8c6] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(92,61,25,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-[#171553]">저장된 인물 {people.length}명</h2>
            <p className="mt-1 text-[12px] text-[#777777]">상담에서 사용할 인물 정보를 확인하고 정리할 수 있어요.</p>
          </div>
        </div>
      </section>

      {message && (
        <p className={`mt-4 rounded-[9px] px-3 py-2 text-[13px] leading-[1.55] ${messageType === 'success' ? 'border border-[#cfe7d2] bg-[#eef8ef] text-[#357247]' : 'border border-[#f0d2c5] bg-[#fff2ec] text-[#a05738]'}`} role="status">
          {message}
        </p>
      )}

      <section className="mt-4 space-y-3 pb-8">
        {people.length > 0 ? (
          people.map((person) => {
            const isDeleting = deletingPersonId === person.id;
            const createdAt = formatCreatedAt(person.createdAt);

            return (
              <article key={person.id} className="rounded-[12px] border border-[#ead8c6] bg-white px-4 py-4 shadow-[0_8px_22px_rgba(92,61,25,0.045)]">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1e6db] text-[#7d5a36]">
                    <UserRound className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[16px] font-semibold text-[#171553]">{person.name}</h3>
                      <span className="rounded-full bg-[#fff8f0] px-2 py-0.5 text-[11px] font-semibold text-[#7d5a36]">{person.relation}</span>
                    </div>
                    <p className="mt-1 break-keep text-[13px] leading-5 text-[#555555]">{formatSavedPersonMeta(person)}</p>
                    {createdAt && <p className="mt-1 text-[11px] text-[#9a9088]">등록일 {createdAt}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/people?edit=${encodeURIComponent(person.id)}`}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#171553] transition hover:bg-[#FEFAF5]"
                      aria-label={`${person.name} 수정`}
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeletePerson(person)}
                      disabled={Boolean(deletingPersonId)}
                      className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#a05738] transition hover:bg-[#fff2ec] disabled:cursor-wait disabled:opacity-50"
                      aria-label={`${person.name} 삭제`}
                    >
                      {isDeleting ? <span className="text-[11px] font-semibold">...</span> : <Trash2 className="h-4 w-4" strokeWidth={2} />}
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#e5d2bd] bg-white px-5 py-10 text-center">
            <UserRound className="mx-auto h-8 w-8 text-[#b06b16]" strokeWidth={1.7} />
            <p className="mt-3 break-keep text-[14px] leading-[1.65] text-[#555555]">저장된 인물이 없습니다.</p>
            <Link href="/people" className="font-display mx-auto mt-4 flex h-10 w-fit items-center justify-center rounded-[9px] bg-[#191450] px-4 text-[13px] font-medium text-white">
              인물 등록하기
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
