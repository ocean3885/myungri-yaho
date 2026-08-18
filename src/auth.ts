import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createAdminClient } from '@/utils/supabase/server';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers } = NextAuth({
    trustHost: true,
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: '이메일', type: 'text' },
                password: { label: '비밀번호', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const adminSupabase = await createAdminClient();
                    const { data: user, error } = await adminSupabase
                        .from('users')
                        .select('*')
                        .eq('email', credentials.email)
                        .maybeSingle();

                    if (error || !user || !user.password_hash) {
                        return null;
                    }

                    const isValid = await bcrypt.compare(
                        credentials.password as string,
                        user.password_hash
                    );

                    if (!isValid) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('Authorize error:', error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: '/auth/signin',
    },
});
