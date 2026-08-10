'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '회원가입에 실패했습니다.');
            }

            router.push('/auth/signin');
        } catch (err) {
            setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full justify-center bg-[#FEFAF5] text-[#121225]">
            <main className="flex min-h-screen w-full max-w-[480px] flex-col bg-[#FEFAF5] px-6 py-8 shadow-[0_0_45px_rgba(47,34,17,0.12)]">
                <div className="flex h-16 items-center justify-center">
                    <Image
                        src="/images/my-logo.png"
                        alt="명리야호"
                        width={180}
                        height={48}
                        priority
                        className="object-contain"
                    />
                </div>

                <section className="mt-10 rounded-[12px] border border-[#ead8c6] bg-white px-5 py-6 shadow-[0_12px_32px_rgba(92,61,25,0.06)]">
                    <div className="mb-7">
                        <h1 className="text-[24px] font-semibold text-[#171553]">회원가입</h1>
                        <p className="mt-2 break-keep text-[14px] leading-[1.65] text-[#66594d]">
                            명리야호 계정을 만들고 상담 결과를 안전하게 저장해보세요.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-[9px] border border-[#f0c7ba] bg-[#fff2ec] px-3 py-3 text-[13px] leading-[1.55] text-[#a05738]">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <label className="block">
                            <span className="mb-2 block text-[14px] font-medium text-[#222222]">이름</span>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="홍길동"
                                className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-4 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-[14px] font-medium text-[#222222]">이메일 주소</span>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-4 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-[14px] font-medium text-[#222222]">비밀번호</span>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="최소 6자 이상"
                                className="h-12 w-full rounded-[10px] border border-[#ead8c6] bg-white px-4 text-[15px] text-[#111111] outline-none transition focus:border-[#191450]"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="font-display flex h-12 w-full cursor-pointer items-center justify-center rounded-[10px] bg-[#191450] text-[15px] font-medium text-white transition hover:bg-[#24206a] disabled:cursor-not-allowed disabled:bg-[#cfc8bd]"
                        >
                            {loading ? '가입 처리 중...' : '회원가입'}
                        </button>
                    </form>

                    <div className="mt-7 space-y-3 border-t border-[#eadfd4] pt-5 text-center text-[13px] text-[#66594d]">
                        <p>
                            이미 계정이 있으신가요?{' '}
                            <Link href="/auth/signin" className="font-semibold text-[#171553] hover:underline">
                                로그인
                            </Link>
                        </p>
                        <Link href="/" className="block font-medium text-[#8a6245] transition hover:text-[#171553]">
                            가입 없이 둘러보기
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
