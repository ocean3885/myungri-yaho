import { CalendarDays } from 'lucide-react';

import type { BaziResult, PillarKey } from '@/components/bazi/types';

const pillarOrder: Array<{ key: PillarKey; label: string }> = [
  { key: 'time', label: '시주' },
  { key: 'day', label: '일주' },
  { key: 'month', label: '월주' },
  { key: 'year', label: '년주' },
];

const pillarMeta: Record<PillarKey, { ganTenGodKey?: string; jiTenGodKey: string }> = {
  time: { ganTenGodKey: 'time_gan', jiTenGodKey: 'time_ji' },
  day: { jiTenGodKey: 'day_ji' },
  month: { ganTenGodKey: 'month_gan', jiTenGodKey: 'month_ji' },
  year: { ganTenGodKey: 'year_gan', jiTenGodKey: 'year_ji' },
};

const detailKeyByPillar: Record<PillarKey, 'hour' | 'day' | 'month' | 'year'> = {
  time: 'hour',
  day: 'day',
  month: 'month',
  year: 'year',
};

export default function BaziPillarsTable({ result }: { result: BaziResult }) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-[#b06b16]" strokeWidth={2} />
        <h3 className="text-[15px] font-semibold text-[#2a2018]">사주 정국</h3>
      </div>

      <div className="mt-3 overflow-hidden rounded-[8px] border border-[#eadfd4] bg-[#fffaf4]">
        <div className="grid grid-cols-4 border-b border-[#eadfd4] text-center">
          {pillarOrder.map((pillar) => (
            <div key={pillar.key} className="min-w-0 border-r border-[#eadfd4] px-1 py-2.5 last:border-r-0">
              <p className="text-[12px] font-semibold text-[#65574b]">{pillar.label}</p>
              <p className="mt-1 min-h-4 break-keep text-[11px] leading-4 text-[#9d7750]">
                {getStemTenGodLabel(result, pillar.key)}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 text-center">
          {pillarOrder.map((pillar) => {
            const pillarText = getPillarText(result, pillar.key);
            const hiddenStems = result.analysis?.details?.[detailKeyByPillar[pillar.key]]?.branch?.jijanggan?.join(', ') || '없음';

            return (
              <article key={pillar.key} className="min-w-0 border-r border-[#eadfd4] last:border-r-0">
                <div className="border-b border-[#eadfd4] py-3">
                  <p className="text-[29px] font-semibold leading-none text-[#171553]">{pillarText.stem}</p>
                </div>
                <div className="border-b border-[#eadfd4] py-3">
                  <p className="text-[29px] font-semibold leading-none text-[#171553]">{pillarText.branch}</p>
                </div>
                <p className="border-b border-[#eadfd4] px-1 py-2 text-[11px] leading-4 text-[#8a6245]">
                  {getTenGod(result, pillarMeta[pillar.key].jiTenGodKey) || '-'}
                </p>
                <p className="min-h-12 break-keep px-1.5 py-2 text-[11px] leading-4 text-[#74675b]">{hiddenStems}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getPillarText(result: BaziResult, key: PillarKey) {
  const pillar = result.four_pillars?.[key];

  return {
    stem: pillar?.gan?.ch || pillar?.gan?.kr || '-',
    branch: pillar?.ji?.ch || pillar?.ji?.kr || '-',
  };
}

function getTenGod(result: BaziResult, key?: string) {
  if (!key) return '';
  return result.ten_gods?.[key] || '';
}

function getStemTenGodLabel(result: BaziResult, key: PillarKey) {
  if (key === 'day') return '일간(나)';
  return getTenGod(result, pillarMeta[key].ganTenGodKey) || '-';
}
