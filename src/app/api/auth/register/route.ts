import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, role } = body;

        if (!email || !password || !name) {
            return NextResponse.json(
                { message: '이메일, 비밀번호, 이름을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        const adminSupabase = await createAdminClient();

        // Check if user already exists
        const { data: existingUser, error: checkError } = await adminSupabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
            return NextResponse.json(
                { message: '이미 가입된 이메일 주소입니다.' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        const { data: newUser, error: insertError } = await adminSupabase
            .from('users')
            .insert({
                email,
                name,
                password_hash: passwordHash,
                role: role || 'user',
            })
            .select('id, email, name, role')
            .single();

        if (insertError) throw insertError;

        return NextResponse.json(
            { message: '회원가입이 완료되었습니다.', user: newUser },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration failed:', error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : '회원가입 처리 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
