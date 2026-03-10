'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface EditablePost {
    id: number;
    slug: string;
    title: string;
    content: string;
    coverImage?: string | null;
    published: boolean;
    author: { id: number };
}

export default function EditPostPage() {
    const params = useParams();
    const id = Number.parseInt(params.id as string, 10);
    const searchParams = useSearchParams();
    const slugFromQuery = searchParams.get('slug')?.trim() || '';
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [published, setPublished] = useState(false);
    const [slug, setSlug] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) router.push('/auth/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (authLoading || !user) return;

        const fetchPost = async () => {
            setLoading(true);
            setError('');

            try {
                if (!Number.isFinite(id)) {
                    setError('Invalid post id');
                    return;
                }

                let targetSlug = slugFromQuery;

                if (!targetSlug && user.role === 'ADMIN') {
                    const adminPosts = await api.adminPosts();
                    targetSlug = adminPosts.find((p: { id: number; slug: string }) => p.id === id)?.slug || '';
                }

                if (!targetSlug) {
                    setError('Unable to load this post directly. Open the post and click Edit again.');
                    return;
                }

                const full = await api.getPost(targetSlug) as EditablePost;
                if (!full || full.id !== id) {
                    setError('Post not found');
                    return;
                }

                if (full.author.id !== user.id && user.role !== 'ADMIN') {
                    setError('Not authorized to edit this post');
                    return;
                }

                setTitle(full.title);
                setContent(full.content);
                setCoverImage(full.coverImage || '');
                setPublished(full.published);
                setSlug(full.slug);
            } catch {
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [authLoading, id, slugFromQuery, user]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await api.uploadImage(file);
            setCoverImage(res.url);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const updated = await api.updatePost(id, { title, content, coverImage, published });
            router.push(`/blog/${updated.slug || slug}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update post');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || authLoading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-white mb-3">Edit Post</h1>
            <p className="text-gray-400 mb-8">Update your article details and publish state.</p>

            <form onSubmit={handleSubmit} className="surface rounded-2xl p-6 sm:p-8 space-y-6">
                {error && (
                    <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Title</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input text-lg font-medium" required />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Cover Image</label>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="btn-secondary cursor-pointer text-sm">
                            {uploading ? 'Uploading...' : 'Change Image'}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        {coverImage && <span className="text-green-400 text-sm">Image set</span>}
                    </div>
                    {coverImage && (
                        <img src={`${process.env.NEXT_PUBLIC_API_URL}${coverImage}`} alt="Cover" className="mt-3 h-40 w-full sm:w-auto rounded-lg object-cover border border-gray-700" />
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Content <span className="text-gray-600">(Markdown supported)</span></label>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20} className="input resize-y font-mono text-sm" required />
                </div>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="w-4 h-4 accent-cyan-600" />
                        <span className="text-gray-300 text-sm">Published</span>
                    </label>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={submitting} className="btn-primary">
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
                </div>
            </form>
        </div>
    );
}
