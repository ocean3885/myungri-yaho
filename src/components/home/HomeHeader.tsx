'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, LogOut, LogIn, Bell } from 'lucide-react';

type UserSession = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type Props = {
  user: UserSession | null;
  signOut: () => void;
};

export default function HomeHeader({ user, signOut }: Props) {
  return (
    <div className="relative z-10 flex justify-between items-center mb-10">
      <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
        <Sparkles className="w-5 h-5 text-purple-400 fill-purple-400" />
        명리야호
      </h1>
      <div className="flex items-center gap-2">
        {user ? (
          <button 
            onClick={() => signOut()}
            title="로그아웃"
            className="p-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/15 hover:text-white transition text-zinc-400 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <Link 
            href="/auth/signin"
            title="로그인"
            className="p-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/15 hover:text-white transition text-zinc-400"
          >
            <LogIn className="w-4 h-4" />
          </Link>
        )}
        <button className="p-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/15 hover:text-white transition text-white relative cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#7a5df5] rounded-full"></span>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#7a5df5] rounded-full animate-ping"></span>
        </button>
      </div>
    </div>
  );
}
