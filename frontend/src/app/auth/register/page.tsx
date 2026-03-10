'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register(name, email, password);
            router.push('/');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
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
                    <h1 className="text-2xl font-bold text-white">Create your account</h1>
                    <p className="text-gray-400 mt-1">Start writing today</p>
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
                        <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Jane Doe"
                            className="input"
                        />
                    </div>

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
                            placeholder="Minimum 6 characters"
                            className="input"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-cyan-300 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
