'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

interface Post {
    id: number;
    title: string;
    slug: string;
    published: boolean;
    createdAt: string;
    author: { name: string; email: string };
    _count: { comments: number };
}

interface Stats {
    users: number;
    posts: number;
    comments: number;
}

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<'stats' | 'users' | 'posts'>('stats');
    const [users, setUsers] = useState<User[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
    }, [user, loading, router]);

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') return;
        setDataLoading(true);
        Promise.all([api.adminStats(), api.adminUsers(), api.adminPosts()])
            .then(([s, u, p]) => {
                setStats(s);
                setUsers(u);
                setPosts(p);
            })
            .catch(console.error)
            .finally(() => setDataLoading(false));
    }, [user]);

    const handleRoleChange = async (userId: number, newRole: string) => {
        await api.adminChangeRole(userId, newRole);
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole as 'USER' | 'ADMIN' } : u)));
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Delete this user and all their content?')) return;
        await api.adminDeleteUser(userId);
        setUsers(users.filter((u) => u.id !== userId));
    };

    const handleDeletePost = async (postId: number) => {
        if (!confirm('Delete this post?')) return;
        await api.adminDeletePost(postId);
        setPosts(posts.filter((p) => p.id !== postId));
        if (stats) setStats({ ...stats, posts: stats.posts - 1 });
    };

    if (loading || dataLoading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading admin panel...</div>;
    }

    if (!user || user.role !== 'ADMIN') return null;

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-slate-950 text-sm font-semibold">
                    ADM
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm">Manage your blog platform</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-8 surface rounded-xl p-1 w-fit">
                {(['stats', 'users', 'posts'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t
                            ? 'bg-cyan-700 text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'stats' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Users', value: stats.users, color: 'from-blue-900/40 to-blue-800/20' },
                        { label: 'Total Posts', value: stats.posts, color: 'from-cyan-900/40 to-cyan-800/20' },
                        { label: 'Total Comments', value: stats.comments, color: 'from-amber-900/40 to-amber-800/20' },
                    ].map((stat) => (
                        <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border border-gray-800 rounded-2xl p-6`}>
                            <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-2">{stat.label}</div>
                            <div className="text-4xl font-bold text-white">{stat.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'users' && (
                <div className="surface rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[740px]">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Name</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Role</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Joined</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-cyan-800 flex items-center justify-center text-white text-xs font-bold">
                                                    {u.name[0].toUpperCase()}
                                                </div>
                                                <span className="text-gray-200 text-sm">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-400 text-sm">{u.email}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-gray-800 text-gray-400'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td className="px-5 py-3">
                                            {u.id !== user.id && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRoleChange(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                                                        className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-800 hover:border-cyan-600 px-2 py-1 rounded transition-colors"
                                                    >
                                                        Make {u.role === 'ADMIN' ? 'User' : 'Admin'}
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="btn-danger text-xs py-1 px-2">
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'posts' && (
                <div className="surface rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[740px]">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Title</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Author</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Status</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Comments</th>
                                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-3">
                                            <Link href={`/blog/${p.slug}`} className="text-gray-200 text-sm hover:text-cyan-300 transition-colors line-clamp-1">
                                                {p.title}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3 text-gray-400 text-sm">{p.author.name}</td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${p.published ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                                                {p.published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-400 text-sm">{p._count.comments}</td>
                                        <td className="px-5 py-3">
                                            <button onClick={() => handleDeletePost(p.id)} className="btn-danger text-xs py-1 px-2">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
