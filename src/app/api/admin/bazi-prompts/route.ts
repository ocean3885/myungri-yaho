import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminAccess } from '@/lib/admin-access';
import {
  defaultBaziPromptPipelineConfig,
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
  const value = normalizeBaziPromptPipelineConfig(body.config || {
    ...defaultBaziPromptPipelineConfig,
    version: `${getBaziConsultationTypeFromSettingKey(key)}-v1`,
  });

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

    revalidatePath('/admin/bazi-prompts');

    return NextResponse.json({
      message: '상담종류 프롬프트를 추가했습니다.',
      key,
      consultationType: getBaziConsultationTypeFromSettingKey(key),
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

    if (nextKey === body.key) {
      return NextResponse.json(
        { message: '기존 key와 동일합니다.' },
        { status: 400 },
      );
    }

    const value = normalizeBaziPromptPipelineConfig(body.config);

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

      revalidatePath('/admin/bazi-prompts');

      return NextResponse.json({
        message: '상담종류 key를 변경했습니다.',
        key: nextKey,
        consultationType: getBaziConsultationTypeFromSettingKey(nextKey),
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

    revalidatePath('/admin/bazi-prompts');

    return NextResponse.json({
      message: intent === 'reset' ? '기본 프롬프트 설정으로 복원했습니다.' : '프롬프트 설정을 저장했습니다.',
      key: body.key,
      consultationType: getBaziConsultationTypeFromSettingKey(body.key),
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
