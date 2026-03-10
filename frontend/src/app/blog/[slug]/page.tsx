'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    author: { id: number; name: string; avatar?: string };
}

interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    coverImage?: string;
    createdAt: string;
    published: boolean;
    author: { id: number; name: string; avatar?: string };
    comments: Comment[];
}

function getDisplayTitle(post: Pick<Post, 'slug' | 'title'>) {
    if (post.slug === 'getting-started-with-devops') return 'Getting Started with Developer Workflows';
    if (post.slug === 'docker-for-beginners') return 'Container Basics for Application Developers';
    return post.title;
}

function getDisplayContent(post: Pick<Post, 'slug' | 'content'>) {
    let content = post.content.replace(/\bDevOps\b/gi, 'developer workflows');
    if (post.slug === 'docker-for-beginners') {
        content = content.replace(/DevOps journey/gi, 'developer workflow journey');
    }
    return content;
}

function renderMarkdown(md: string): string {
    const escapeHtml = (value: string) =>
        value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const codeBlocks: string[] = [];
    let html = escapeHtml(md).replace(/```(\w+)?\n?([\s\S]*?)```/g, (_match, lang = '', code = '') => {
        const token = `__CODE_BLOCK_${codeBlocks.length}__`;
        const className = lang ? ` class="language-${lang}"` : '';
        codeBlocks.push(`<pre><code${className}>${code.trimEnd()}</code></pre>`);
        return token;
    });

    html = html
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^\- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, (line) => {
            if (!line.trim()) return line;
            if (!line.startsWith('<') && !line.startsWith('__CODE_BLOCK_')) return `<p>${line}</p>`;
            return line;
        })
        .replace(/<p>(__CODE_BLOCK_\d+__)\s*<\/p>/g, '$1');

    return html.replace(/__CODE_BLOCK_(\d+)__/g, (_match, index) => codeBlocks[Number(index)] ?? '');
}

export default function BlogDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const { user } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        api.getPost(slug)
            .then(setPost)
            .catch(() => router.push('/'))
            .finally(() => setLoading(false));
    }, [slug, router]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !post) return;
        setSubmitting(true);
        try {
            const newComment = await api.addComment({ content: comment, postId: post.id });
            setPost({ ...post, comments: [...post.comments, newComment] });
            setComment('');
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!post) return;
        await api.deleteComment(commentId);
        setPost({ ...post, comments: post.comments.filter((c) => c.id !== commentId) });
    };

    const handleDeletePost = async () => {
        if (!post || !confirm('Delete this post?')) return;
        setDeleting(true);
        setDeleteError('');
        try {
            await api.deletePost(post.id);
            router.push('/');
        } catch (err: unknown) {
            setDeleteError(err instanceof Error ? err.message : 'Failed to delete post');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="surface h-64 rounded-2xl animate-pulse mb-8" />
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-900 rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!post) return null;

    const isAuthor = user?.id === post.author.id;
    const isAdmin = user?.role === 'ADMIN';
    const date = new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const displayTitle = getDisplayTitle(post);
    const displayContent = getDisplayContent(post);

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            {post.coverImage && (
                <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${post.coverImage}`}
                    alt={post.title}
                    className="w-full h-64 md:h-80 object-cover rounded-2xl mb-8 border border-gray-800"
                />
            )}

            <div className="mb-8">
                {!post.published && (
                    <span className="inline-block bg-yellow-900/40 border border-yellow-700 text-yellow-300 text-xs px-2 py-1 rounded mb-3">
                        Draft
                    </span>
                )}
                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
                    {displayTitle}
                </h1>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-700 flex items-center justify-center text-white font-bold">
                            {post.author.name[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-white font-medium text-sm">{post.author.name}</p>
                            <p className="text-gray-500 text-xs">{date}</p>
                        </div>
                    </div>
                    {(isAuthor || isAdmin) && (
                        <div className="flex gap-2">
                            {isAuthor && (
                                <Link href={{ pathname: `/edit/${post.id}`, query: { slug: post.slug } }} className="btn-secondary text-sm py-1.5 px-3">
                                    Edit
                                </Link>
                            )}
                            <button onClick={handleDeletePost} disabled={deleting} className="btn-danger">
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    )}
                </div>
                {deleteError && <p className="text-sm text-red-400 mt-3">{deleteError}</p>}
            </div>

            <article
                className="prose"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
            />

            <section className="mt-12 border-t border-gray-800 pt-10">
                <h2 className="text-xl font-bold text-white mb-6">
                    {post.comments.length} Comment{post.comments.length !== 1 ? 's' : ''}
                </h2>

                {post.comments.map((c) => (
                    <div key={c.id} className="surface rounded-xl p-4 mb-3 group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-full bg-cyan-800 flex items-center justify-center text-white text-xs font-bold">
                                    {c.author.name[0].toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-300">{c.author.name}</span>
                                <span className="text-xs text-gray-600">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            {(user?.id === c.author.id || isAdmin) && (
                                <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="text-gray-500 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                        <p className="text-gray-300 text-sm">{c.content}</p>
                    </div>
                ))}

                {user ? (
                    <form onSubmit={handleAddComment} className="mt-6 space-y-3">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Leave a comment..."
                            rows={3}
                            className="input resize-none"
                        />
                        <button type="submit" disabled={submitting || !comment.trim()} className="btn-primary">
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </form>
                ) : (
                    <div className="surface mt-6 rounded-xl p-5 text-center">
                        <p className="text-gray-400 text-sm mb-3">Sign in to leave a comment</p>
                        <Link href="/auth/login" className="btn-primary inline-block">Sign in</Link>
                    </div>
                )}
            </section>
        </div>
    );
}
