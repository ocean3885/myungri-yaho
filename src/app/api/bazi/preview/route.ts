import { NextRequest, NextResponse } from 'next/server';
import type { BaziResult } from '@/components/bazi/types';

const BAZI_API_URL = 'https://bazi.dowon.ai.kr/';
const VALID_CALENDAR_TYPES = new Set(['sol', 'lun', 'lun_y']);
const VALID_GENDERS = new Set(['남', '여']);

function isValidNumberParam(value: string | null, minLength: number, maxLength = minLength) {
  return Boolean(value && new RegExp(`^\\d{${minLength},${maxLength}}$`).test(value));
}

function hasFourPillars(value: unknown): value is BaziResult {
  if (!value || typeof value !== 'object') return false;
  return 'four_pillars' in value;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const day = searchParams.get('day');
  const hour = searchParams.get('hour');
  const min = searchParams.get('min');
  const sl = searchParams.get('sl');
  const gen = searchParams.get('gen');

  if (
    !isValidNumberParam(year, 4) ||
    !isValidNumberParam(month, 1, 2) ||
    !isValidNumberParam(day, 1, 2) ||
    !isValidNumberParam(hour, 2) ||
    !isValidNumberParam(min, 2) ||
    !sl ||
    !VALID_CALENDAR_TYPES.has(sl) ||
    !gen ||
    !VALID_GENDERS.has(gen)
  ) {
    return NextResponse.json({ message: '만세력 조회 파라미터가 올바르지 않습니다.' }, { status: 400 });
  }

  const validatedParams = {
    year,
    month,
    day,
    hour,
    min,
    sl,
    gen,
  } as Record<'year' | 'month' | 'day' | 'hour' | 'min' | 'sl' | 'gen', string>;

  const apiUrl = new URL(BAZI_API_URL);
  apiUrl.searchParams.set('year', validatedParams.year);
  apiUrl.searchParams.set('month', validatedParams.month);
  apiUrl.searchParams.set('day', validatedParams.day);
  apiUrl.searchParams.set('hour', validatedParams.hour);
  apiUrl.searchParams.set('min', validatedParams.min);
  apiUrl.searchParams.set('sl', validatedParams.sl);
  apiUrl.searchParams.set('gen', validatedParams.gen);

  try {
    const response = await fetch(apiUrl, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    const data: unknown = await response.json();

    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string'
          ? data.detail
          : '만세력 정보를 불러오지 못했습니다.';

      return NextResponse.json({ message }, { status: response.status });
    }

    if (!hasFourPillars(data)) {
      return NextResponse.json({ message: '만세력 응답 형식이 올바르지 않습니다.' }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Bazi preview request failed:', error);
    return NextResponse.json({ message: '만세력 API 요청 중 오류가 발생했습니다.' }, { status: 502 });
  }
}
