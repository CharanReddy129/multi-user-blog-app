'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function WritePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [published, setPublished] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && !user) router.push('/auth/login');
    }, [user, loading, router]);

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
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const post = await api.createPost({ title, content, coverImage, published });
            router.push(`/blog/${post.slug}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create post');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading...</div>;
    if (!user) return null;

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-white mb-3">Write a New Post</h1>
            <p className="text-gray-400 mb-8">Draft your article in markdown and publish when ready.</p>

            <form onSubmit={handleSubmit} className="surface rounded-2xl p-6 sm:p-8 space-y-6">
                {error && (
                    <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Your article title"
                        className="input text-lg font-medium"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Cover Image</label>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="btn-secondary cursor-pointer text-sm">
                            {uploading ? 'Uploading...' : 'Choose Image'}
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        {coverImage && (
                            <span className="text-green-400 text-sm">Image uploaded</span>
                        )}
                    </div>
                    {coverImage && (
                        <img
                            src={`${process.env.NEXT_PUBLIC_API_URL}${coverImage}`}
                            alt="Cover preview"
                            className="mt-3 h-40 w-full sm:w-auto rounded-lg object-cover border border-gray-700"
                        />
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                        Content <span className="text-gray-600">(Markdown supported)</span>
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`# Your post title\n\nWrite your content here. Markdown is supported.\n\n## Section\n\nParagraph text...`}
                        rows={20}
                        className="input resize-y font-mono text-sm"
                        required
                    />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={published}
                            onChange={(e) => setPublished(e.target.checked)}
                            className="w-4 h-4 accent-cyan-600"
                        />
                        <span className="text-gray-300 text-sm">Publish immediately</span>
                    </label>
                    <span className="text-gray-600 text-xs">Unchecked means save as draft.</span>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={submitting} className="btn-primary">
                        {submitting ? 'Publishing...' : published ? 'Publish Post' : 'Save Draft'}
                    </button>
                    <button type="button" onClick={() => router.back()} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
