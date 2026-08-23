import { NextRequest, NextResponse } from 'next/server';
import type { BaziResult } from '@/components/bazi/types';
import { auth } from '@/auth';
import { createAdminClient } from '@/utils/supabase/server';

const relationValues = ['나', '배우자', '가족', '친구', '기타'] as const;
const genderValues = ['남성', '여성'] as const;
const calendarValues = ['양력', '음력'] as const;

type SavePersonBody = {
  id?: string;
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

function validatePersonBody(body: SavePersonBody) {
  const name = normalizeName(body.name);

  if (!name) {
    return { error: '이름을 입력해주세요.' };
  }

  if (
    !isIncluded(relationValues, body.relation) ||
    !isIncluded(genderValues, body.gender) ||
    !isIncluded(calendarValues, body.calendar) ||
    typeof body.birthDate !== 'string' ||
    !hasValidBirthParams(body.birthParams) ||
    !body.baziResult?.four_pillars
  ) {
    return { error: '저장할 사주 정보가 올바르지 않습니다.' };
  }

  return {
    name,
    relation: body.relation,
    gender: body.gender,
    calendar: body.calendar,
    birthDate: body.birthDate,
    birthTime: body.birthTime || null,
    birthParams: body.birthParams,
    baziResult: body.baziResult,
  };
}

function formatPersonResponse(data: {
  id: string;
  name: string;
  relation: string;
  gender: string;
  calendar: string;
  birth_date: string;
  birth_time: string | null;
  birth_params: BaziResult['birth_params'];
  bazi_result: BaziResult;
  created_at: string;
}) {
  return {
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
  };
}

async function readPersonBody(request: NextRequest) {
  try {
    return await request.json() as SavePersonBody;
  } catch {
    return null;
  }
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

  const body = await readPersonBody(request);

  if (!body) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const validated = validatePersonBody(body);

  if ('error' in validated) {
    return NextResponse.json(
      { message: validated.error },
      { status: 400 },
    );
  }

  try {
    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
      .from('people')
      .insert({
        user_id: userId,
        name: validated.name,
        relation: validated.relation,
        gender: validated.gender,
        calendar: validated.calendar,
        birth_date: validated.birthDate,
        birth_time: validated.birthTime,
        birth_params: validated.birthParams,
        bazi_result: {
          ...validated.baziResult,
          birth_params: validated.birthParams,
        },
      })
      .select('id, name, relation, gender, calendar, birth_date, birth_time, birth_params, bazi_result, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: '인물 정보를 저장했습니다.',
      person: formatPersonResponse(data),
    });
  } catch (error) {
    console.error('Save person failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '인물 정보 저장에 실패했습니다.' },
      { status: 502 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { message: '로그인 후 인물 정보를 수정할 수 있습니다.' },
      { status: 401 },
    );
  }

  const body = await readPersonBody(request);

  if (!body) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  if (!body.id) {
    return NextResponse.json(
      { message: '수정할 인물 정보가 없습니다.' },
      { status: 400 },
    );
  }

  const validated = validatePersonBody(body);

  if ('error' in validated) {
    return NextResponse.json(
      { message: validated.error },
      { status: 400 },
    );
  }

  try {
    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
      .from('people')
      .update({
        name: validated.name,
        relation: validated.relation,
        gender: validated.gender,
        calendar: validated.calendar,
        birth_date: validated.birthDate,
        birth_time: validated.birthTime,
        birth_params: validated.birthParams,
        bazi_result: {
          ...validated.baziResult,
          birth_params: validated.birthParams,
        },
      })
      .eq('id', body.id)
      .eq('user_id', userId)
      .select('id, name, relation, gender, calendar, birth_date, birth_time, birth_params, bazi_result, created_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: '인물 정보를 수정했습니다.',
      person: formatPersonResponse(data),
    });
  } catch (error) {
    console.error('Update person failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '인물 정보 수정에 실패했습니다.' },
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
