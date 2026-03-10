'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            router.push('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xl mx-auto mb-4">
                        DB
                    </div>
                    <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                    <p className="text-gray-400 mt-1">Sign in to your account</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="surface rounded-2xl p-8 space-y-5"
                >
                    {error && (
                        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            className="input"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link href="/auth/register" className="text-cyan-300 hover:underline">
                            Register
                        </Link>
                    </p>

                    <div className="border-t border-gray-800 pt-4">
                        <p className="text-xs text-gray-600 text-center">Demo credentials</p>
                        <p className="text-xs text-gray-500 text-center mt-1">
                            Admin: admin@blog.com / admin123 | User: demo@blog.com / user123
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
