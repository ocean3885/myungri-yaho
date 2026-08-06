'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Plus, UserRound } from 'lucide-react';

type UserSession = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type PersonItem = {
  id: string;
  name: string;
  relation: string;
  gender: string;
  calendar: string;
  birth_date: string;
  birth_time?: string | null;
};

type Props = {
  user: UserSession | null;
  people: PersonItem[];
  selectedPerson: PersonItem | null;
  onSelectPerson: (personId: string) => void;
};

function formatPersonMeta(person: PersonItem) {
  return `${person.calendar} ${person.birth_date}${person.birth_time ? ` ${person.birth_time}` : ''} · ${person.gender}`;
}

export default function HomePersonSelector({ user, people, selectedPerson, onSelectPerson }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const currentName = selectedPerson?.name || user?.name || '김명리';
  const currentRelation = selectedPerson?.relation || '나';
  const hasPeople = people.length > 0;

  return (
    <section className="relative mt-8">
      <h2 className="text-[17px] font-semibold text-[#111111]">현재 보고 있는 인물</h2>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="mt-3 flex h-[56px] w-full items-center justify-between rounded-[12px] border border-[#ead8c6] bg-white px-4 transition hover:border-[#dfc5aa]"
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#191450] text-white">
            <UserRound className="h-6 w-6 fill-white/80 stroke-[1.6]" />
          </span>
          <span className="truncate text-[18px] font-medium tracking-normal text-[#16144d] max-[360px]:text-[17px]">
            {currentName} · {currentRelation}
          </span>
        </span>
        <ChevronDown className={`h-6 w-6 shrink-0 text-[#151348] stroke-[2.4] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[86px] z-30 overflow-hidden rounded-[12px] border border-[#ead8c6] bg-white shadow-[0_18px_40px_rgba(47,34,17,0.16)]">
          {hasPeople ? (
            <div className="max-h-[280px] overflow-y-auto py-1">
              {people.map((person) => {
                const isSelected = person.id === selectedPerson?.id;

                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      onSelectPerson(person.id);
                      setIsOpen(false);
                    }}
                    className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#fff8f0]"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-[#191450] text-white' : 'bg-[#f1e6db] text-[#7d5a36]'}`}>
                      {isSelected ? <Check className="h-5 w-5" strokeWidth={2.3} /> : <UserRound className="h-5 w-5" strokeWidth={1.8} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-[#171553]">
                        {person.name} · {person.relation}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-[#6b6259]">
                        {formatPersonMeta(person)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-[13px] leading-[1.6] text-[#5d5147]">저장된 인물이 아직 없습니다.</p>
            </div>
          )}

          <Link
            href="/people"
            className="flex h-12 items-center justify-center gap-2 border-t border-[#f0e4d8] bg-[#FEFAF5] text-[14px] font-semibold text-[#171553] transition hover:bg-[#fff8f0]"
            onClick={() => setIsOpen(false)}
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            인물 추가하기
          </Link>
        </div>
      )}
    </section>
  );
}
