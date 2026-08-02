'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

            // Successfully registered, send to sign-in page
            router.push('/auth/signin');
        } catch (err) {
            setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen app-simulator-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0c0a1a] border border-[#1f1a3a] rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">명리야호 회원가입</h1>
                    <p className="text-zinc-400 text-sm">새로운 명리야호 계정을 생성합니다.</p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl p-4 mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-2">이름</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="홍길동"
                            className="w-full bg-[#16122c] border border-[#2b2554] rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 focus:outline-hidden transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-2">이메일 주소</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            className="w-full bg-[#16122c] border border-[#2b2554] rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 focus:outline-hidden transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-2">비밀번호</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="최소 6자 이상"
                            className="w-full bg-[#16122c] border border-[#2b2554] rounded-xl px-4 py-3 text-white text-sm focus:border-purple-500 focus:outline-hidden transition"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-purple-950/30"
                    >
                        {loading ? '가입 처리 중...' : '회원가입'}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-zinc-400 space-y-3">
                    <div>
                        이미 계정이 있으신가요?{' '}
                        <Link href="/auth/signin" className="text-purple-400 font-semibold hover:underline">
                            로그인
                        </Link>
                    </div>
                    <div className="pt-3 border-t border-[#1f1a3a]/60">
                        <Link href="/" className="text-zinc-500 hover:text-zinc-300 font-medium transition block">
                            가입 없이 둘러보기 (홈으로 이동)
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
