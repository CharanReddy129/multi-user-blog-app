'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
    _count: { comments: number };
}

export default function MyPostsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) router.push('/auth/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (authLoading || !user) return;

        api.myPosts()
            .then((data: Post[]) => setPosts(data))
            .catch(() => setError('Failed to load your posts'))
            .finally(() => setLoading(false));
    }, [authLoading, user]);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.deletePost(id);
            setPosts((prev) => prev.filter((p) => p.id !== id));
        } catch {
            setError('Failed to delete post');
        }
    };

    const handleTogglePublish = async (post: Post) => {
        try {
            await api.updatePost(post.id, { published: !post.published });
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id ? { ...p, published: !p.published } : p
                )
            );
        } catch {
            setError('Failed to update post');
        }
    };

    if (authLoading || loading) {
        return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
    }
    if (!user) return null;

    const drafts = posts.filter((p) => !p.published);
    const published = posts.filter((p) => p.published);

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Posts</h1>
                    <p className="text-gray-400 mt-1">Manage your drafts and published articles.</p>
                </div>
                <Link href="/write" className="btn-primary">
                    + New Post
                </Link>
            </div>

            {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm mb-6">
                    {error}
                </div>
            )}

            {/* Drafts Section */}
            {drafts.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-amber-300 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Drafts ({drafts.length})
                    </h2>
                    <div className="space-y-3">
                        {drafts.map((post) => (
                            <PostRow
                                key={post.id}
                                post={post}
                                onDelete={handleDelete}
                                onTogglePublish={handleTogglePublish}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Published Section */}
            <section>
                <h2 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    Published ({published.length})
                </h2>
                {published.length === 0 ? (
                    <p className="text-gray-500 text-sm">No published posts yet.</p>
                ) : (
                    <div className="space-y-3">
                        {published.map((post) => (
                            <PostRow
                                key={post.id}
                                post={post}
                                onDelete={handleDelete}
                                onTogglePublish={handleTogglePublish}
                            />
                        ))}
                    </div>
                )}
            </section>

            {posts.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-xl font-medium mb-2">No posts yet</p>
                    <p>Start writing your first article!</p>
                    <Link href="/write" className="btn-primary mt-4 inline-block">Write a Post</Link>
                </div>
            )}
        </div>
    );
}

function PostRow({
    post,
    onDelete,
    onTogglePublish,
}: {
    post: Post;
    onDelete: (id: number) => void;
    onTogglePublish: (post: Post) => void;
}) {
    const date = new Date(post.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });

    return (
        <div className="surface rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{post.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{date}</span>
                    <span>{post._count.comments} comments</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${post.published
                            ? 'bg-green-900/40 text-green-300'
                            : 'bg-amber-900/40 text-amber-300'
                        }`}>
                        {post.published ? 'Published' : 'Draft'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={() => onTogglePublish(post)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${post.published
                            ? 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50'
                            : 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                        }`}
                >
                    {post.published ? 'Unpublish' : 'Publish'}
                </button>
                <Link
                    href={`/edit/${post.id}?slug=${post.slug}`}
                    className="text-xs px-3 py-1.5 rounded-md bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50 transition-colors"
                >
                    Edit
                </Link>
                <button
                    onClick={() => onDelete(post.id)}
                    className="text-xs px-3 py-1.5 rounded-md bg-red-900/30 text-red-300 hover:bg-red-900/50 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}
