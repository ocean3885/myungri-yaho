import { NextRequest, NextResponse } from 'next/server';
import type { BaziResult } from '@/components/bazi/types';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';

const relationValues = ['나', '배우자', '가족', '친구', '기타'] as const;
const genderValues = ['남성', '여성'] as const;
const calendarValues = ['양력', '음력'] as const;

type SavePersonBody = {
  name?: string;
  relation?: string;
  gender?: string;
  calendar?: string;
  birthDate?: string;
  birthTime?: string;
  birthParams?: BaziResult['birth_params'];
  baziResult?: BaziResult;
};

function isIncluded<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function normalizeName(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 100);
}

function hasValidBirthParams(value: SavePersonBody['birthParams']): value is NonNullable<BaziResult['birth_params']> {
  return Boolean(value?.year && value.month && value.day && value.hour && value.min && value.sl && value.gen);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { message: '로그인 후 인물 정보를 저장할 수 있습니다.' },
      { status: 401 },
    );
  }

  let body: SavePersonBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const name = normalizeName(body.name);

  if (!name) {
    return NextResponse.json(
      { message: '이름을 입력해주세요.' },
      { status: 400 },
    );
  }

  if (
    !isIncluded(relationValues, body.relation) ||
    !isIncluded(genderValues, body.gender) ||
    !isIncluded(calendarValues, body.calendar) ||
    typeof body.birthDate !== 'string' ||
    !hasValidBirthParams(body.birthParams) ||
    !body.baziResult?.four_pillars
  ) {
    return NextResponse.json(
      { message: '저장할 사주 정보가 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  try {
    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
      .from('people')
      .insert({
        user_id: userId,
        name,
        relation: body.relation,
        gender: body.gender,
        calendar: body.calendar,
        birth_date: body.birthDate,
        birth_time: body.birthTime || null,
        birth_params: body.birthParams,
        bazi_result: {
          ...body.baziResult,
          birth_params: body.birthParams,
        },
      })
      .select('id, name, relation, gender, calendar, birth_date, birth_time, birth_params, bazi_result, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: '인물 정보를 저장했습니다.',
      person: {
        id: data.id,
        name: data.name,
        relation: data.relation,
        gender: data.gender,
        calendar: data.calendar,
        birthDate: data.birth_date,
        birthTime: data.birth_time,
        birthParams: data.birth_params,
        baziResult: data.bazi_result,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Save person failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '인물 정보 저장에 실패했습니다.' },
      { status: 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { message: '로그인 후 인물 정보를 삭제할 수 있습니다.' },
      { status: 401 },
    );
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { message: '삭제할 인물 정보가 없습니다.' },
      { status: 400 },
    );
  }

  try {
    const adminSupabase = await createAdminClient();
    const { error } = await adminSupabase
      .from('people')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({
      message: '인물 정보를 삭제했습니다.',
      id,
    });
  } catch (error) {
    console.error('Delete person failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '인물 정보 삭제에 실패했습니다.' },
      { status: 502 },
    );
  }
}
