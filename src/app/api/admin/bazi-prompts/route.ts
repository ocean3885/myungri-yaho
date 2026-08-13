import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminAccess } from '@/lib/admin-access';
import {
  defaultBaziPromptPipelineConfig,
  DEFAULT_BAZI_CONSULTATION_TYPE,
  getBaziPromptSettingKey,
  getBaziConsultationTypeFromSettingKey,
  isBaziPromptSettingKey,
  normalizeBaziPromptPipelineConfig,
} from '@/lib/bazi-prompt-config';
import { createAdminClient } from '@/utils/supabase/server';

type UpdateBody = {
  intent?: string;
  key?: unknown;
  consultationType?: unknown;
  name?: unknown;
  description?: unknown;
  enabled?: unknown;
  sortOrder?: unknown;
  config?: unknown;
};

export async function POST(request: NextRequest) {
  const admin = await getAdminAccess();

  if (!admin) {
    return NextResponse.json(
      { message: '관리자 권한이 필요합니다.' },
      { status: 403 },
    );
  }

  let body: UpdateBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  if (typeof body.consultationType !== 'string' || !body.consultationType.trim()) {
    return NextResponse.json(
      { message: '상담종류 key를 입력해주세요.' },
      { status: 400 },
    );
  }

  const key = getBaziPromptSettingKey(body.consultationType);
  const consultationType = getBaziConsultationTypeFromSettingKey(key);
  const value = normalizeBaziPromptPipelineConfig(body.config || {
    ...defaultBaziPromptPipelineConfig,
    version: `${consultationType}-v1`,
  });
  const name = normalizeConsultationTypeName(body.name, consultationType);
  const description = normalizeOptionalText(body.description);
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
  const sortOrder = normalizeSortOrder(body.sortOrder);

  try {
    const adminSupabase = await createAdminClient();
    const { data: existing, error: existingError } = await adminSupabase
      .from('service_settings')
      .select('key')
      .eq('key', key)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        { message: '이미 존재하는 상담종류 key입니다.' },
        { status: 409 },
      );
    }

    const { error } = await adminSupabase
      .from('service_settings')
      .insert({
        key,
        value,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    const { error: consultationTypeError } = await adminSupabase
      .from('consultation_types')
      .upsert({
        key: consultationType,
        name,
        description,
        prompt_setting_key: key,
        enabled,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      });

    if (consultationTypeError) throw consultationTypeError;

    revalidatePath('/admin/bazi-prompts');

    return NextResponse.json({
      message: '상담종류 프롬프트를 추가했습니다.',
      key,
      consultationType,
      name,
      description,
      enabled,
      sortOrder,
      config: value,
    });
  } catch (error) {
    console.error('Create bazi prompt setting failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '프롬프트 설정 추가 중 오류가 발생했습니다.' },
      { status: 502 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminAccess();

  if (!admin) {
    return NextResponse.json(
      { message: '관리자 권한이 필요합니다.' },
      { status: 403 },
    );
  }

  let body: UpdateBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  if (!isBaziPromptSettingKey(body.key)) {
    return NextResponse.json(
      { message: '프롬프트 key 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const intent = body.intent === 'reset' ? 'reset' : 'save';

  if (body.intent === 'rename') {
    if (typeof body.consultationType !== 'string' || !body.consultationType.trim()) {
      return NextResponse.json(
        { message: '변경할 상담종류 key를 입력해주세요.' },
        { status: 400 },
      );
    }

    const nextKey = getBaziPromptSettingKey(body.consultationType);
    const previousConsultationType = getBaziConsultationTypeFromSettingKey(body.key);
    const nextConsultationType = getBaziConsultationTypeFromSettingKey(nextKey);

    if (nextKey === body.key) {
      return NextResponse.json(
        { message: '기존 key와 동일합니다.' },
        { status: 400 },
      );
    }

    const value = normalizeBaziPromptPipelineConfig(body.config);
    const name = normalizeConsultationTypeName(body.name, nextConsultationType);
    const description = normalizeOptionalText(body.description);
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
    const sortOrder = normalizeSortOrder(body.sortOrder);

    try {
      const adminSupabase = await createAdminClient();
      const { data: existing, error: existingError } = await adminSupabase
        .from('service_settings')
        .select('key')
        .eq('key', nextKey)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        return NextResponse.json(
          { message: '이미 존재하는 상담종류 key입니다.' },
          { status: 409 },
        );
      }

      const { error: insertError } = await adminSupabase
        .from('service_settings')
        .insert({
          key: nextKey,
          value,
          updated_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      const { error: deleteError } = await adminSupabase
        .from('service_settings')
        .delete()
        .eq('key', body.key);

      if (deleteError) throw deleteError;

      const { error: consultationTypeError } = await adminSupabase
        .from('consultation_types')
        .upsert({
          key: nextConsultationType,
          name,
          description,
          prompt_setting_key: nextKey,
          enabled,
          sort_order: sortOrder,
          updated_at: new Date().toISOString(),
        });

      if (consultationTypeError) throw consultationTypeError;

      if (previousConsultationType !== nextConsultationType) {
        const { error: previousTypeDeleteError } = await adminSupabase
          .from('consultation_types')
          .delete()
          .eq('key', previousConsultationType);

        if (previousTypeDeleteError) throw previousTypeDeleteError;
      }

      revalidatePath('/admin/bazi-prompts');

      return NextResponse.json({
        message: '상담종류 key를 변경했습니다.',
        key: nextKey,
        consultationType: nextConsultationType,
        name,
        description,
        enabled,
        sortOrder,
        config: value,
      });
    } catch (error) {
      console.error('Rename bazi prompt setting failed:', error);
      return NextResponse.json(
        { message: error instanceof Error ? error.message : '프롬프트 key 변경 중 오류가 발생했습니다.' },
        { status: 502 },
      );
    }
  }

  const value = intent === 'reset'
    ? {
      ...defaultBaziPromptPipelineConfig,
      version: `${getBaziConsultationTypeFromSettingKey(body.key)}-v1`,
    }
    : normalizeBaziPromptPipelineConfig(body.config);

  try {
    const adminSupabase = await createAdminClient();
    const { error } = await adminSupabase
      .from('service_settings')
      .upsert({
        key: body.key,
        value,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    const consultationType = getBaziConsultationTypeFromSettingKey(body.key);
    const name = normalizeConsultationTypeName(body.name, consultationType);
    const description = normalizeOptionalText(body.description);
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
    const sortOrder = normalizeSortOrder(body.sortOrder);
    const { error: consultationTypeError } = await adminSupabase
      .from('consultation_types')
      .upsert({
        key: consultationType,
        name,
        description,
        prompt_setting_key: body.key,
        enabled,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      });

    if (consultationTypeError) throw consultationTypeError;

    revalidatePath('/admin/bazi-prompts');

    return NextResponse.json({
      message: intent === 'reset' ? '기본 프롬프트 설정으로 복원했습니다.' : '프롬프트 설정을 저장했습니다.',
      key: body.key,
      consultationType,
      name,
      description,
      enabled,
      sortOrder,
      config: value,
    });
  } catch (error) {
    console.error('Update bazi prompt setting failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '프롬프트 설정 저장 중 오류가 발생했습니다.' },
      { status: 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminAccess();

  if (!admin) {
    return NextResponse.json(
      { message: '관리자 권한이 필요합니다.' },
      { status: 403 },
    );
  }

  const key = request.nextUrl.searchParams.get('key');

  if (!isBaziPromptSettingKey(key)) {
    return NextResponse.json(
      { message: '삭제할 프롬프트 key가 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  try {
    const adminSupabase = await createAdminClient();
    const { error } = await adminSupabase
      .from('service_settings')
      .delete()
      .eq('key', key);

    if (error) throw error;

    const { error: consultationTypeError } = await adminSupabase
      .from('consultation_types')
      .delete()
      .eq('key', getBaziConsultationTypeFromSettingKey(key));

    if (consultationTypeError) throw consultationTypeError;

    revalidatePath('/admin/bazi-prompts');

    return NextResponse.json({
      message: '상담종류 프롬프트를 삭제했습니다.',
      key,
    });
  } catch (error) {
    console.error('Delete bazi prompt setting failed:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : '프롬프트 설정 삭제 중 오류가 발생했습니다.' },
      { status: 502 },
    );
  }
}

function normalizeConsultationTypeName(value: unknown, fallbackKey: string) {
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 100);
  if (fallbackKey === DEFAULT_BAZI_CONSULTATION_TYPE) return '기본 상담';

  return fallbackKey;
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') return null;
  const text = value.trim().slice(0, 500);
  return text || null;
}

function normalizeSortOrder(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return 100;

  return Math.floor(Math.min(9999, Math.max(0, number)));
}
