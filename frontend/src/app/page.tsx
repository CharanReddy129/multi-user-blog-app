'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  createdAt: string;
  author: { id: number; name: string; avatar?: string };
  _count: { comments: number };
}

function getDisplayTitle(post: Pick<Post, 'slug' | 'title'>) {
  if (post.slug === 'getting-started-with-devops') return 'Getting Started with Developer Workflows';
  if (post.slug === 'docker-for-beginners') return 'Container Basics for Application Developers';
  return post.title;
}

function PostCard({ post }: { post: Post }) {
  const plain = post.content
    .replace(/#{1,6}\s/g, '')
    .replace(/[*`\[\]]/g, '')
    .replace(/\bDevOps\b/gi, 'developer workflows')
    .trim();
  const excerpt = plain.length > 160 ? `${plain.slice(0, 160)}...` : plain;
  const displayTitle = getDisplayTitle(post);
  const date = new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="card-hover surface group rounded-2xl overflow-hidden h-full flex flex-col">
        {post.coverImage ? (
          <div className="h-48 overflow-hidden">
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${post.coverImage}`}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-cyan-900/30 to-slate-800/20 flex items-center justify-center">
            <span className="text-4xl tracking-widest text-cyan-200/40 font-bold">POST</span>
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <h2 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors line-clamp-2">
            {displayTitle}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed flex-1 line-clamp-3">{excerpt}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 shrink-0 rounded-full bg-cyan-700 flex items-center justify-center text-white font-semibold">
                {post.author.name[0].toUpperCase()}
              </div>
              <span className="truncate">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span>{post._count.comments} comments</span>
              <span>{date}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getPosts(page, search)
      .then((data) => {
        setPosts(data.posts);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="page-shell">
      <section className="text-center mb-12">
        <p className="inline-flex items-center rounded-full border border-cyan-800/70 bg-cyan-900/20 px-3 py-1 text-xs uppercase tracking-[0.16em] text-cyan-200">
          Built for software developers
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mt-4 mb-4">
          <span className="gradient-text">DevBlog</span>
        </h1>
        <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
          Tutorials, architecture notes, and practical coding workflows from the developer community.
        </p>

        <form onSubmit={handleSearch} className="mt-7 flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search articles..."
            className="input flex-1"
          />
          <button type="submit" className="btn-primary justify-center sm:min-w-[120px]">Search</button>
        </form>

        {search && (
          <p className="text-gray-500 text-sm mt-2">
            {total} result{total !== 1 ? 's' : ''} for &quot;{search}&quot; {' - '}
            <button className="text-cyan-300 hover:underline" onClick={() => { setSearch(''); setSearchInput(''); }}>
              Clear
            </button>
          </p>
        )}
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="surface rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-3">No matches</p>
          <p className="text-xl font-medium">No posts found</p>
          <p className="mt-2">Be the first to share something.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-40"
              >
                Prev
              </button>
              <span className="flex items-center px-4 text-gray-400 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
