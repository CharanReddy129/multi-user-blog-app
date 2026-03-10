'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuId = 'mobile-main-menu';

    const handleLogout = async () => {
        await logout();
        setMenuOpen(false);
        router.push('/');
        router.refresh();
    };

    const navLinkClass = (href: string) =>
        `text-sm px-3 py-1.5 rounded-md transition-colors ${pathname === href
            ? 'bg-cyan-900/40 text-cyan-200'
            : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
        }`;

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-800/90 bg-gray-950/85 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                        DV
                    </div>
                    <span className="text-lg font-semibold text-gray-100">DevBlog</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-2">
                    <Link href="/" className={navLinkClass('/')}>
                        Home
                    </Link>
                    {!loading && (
                        <>
                            {user ? (
                                <>
                                    <Link
                                        href="/write"
                                        className={navLinkClass('/write')}
                                    >
                                        Write
                                    </Link>
                                    {user.role === 'ADMIN' && (
                                        <Link
                                            href="/admin"
                                            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${pathname === '/admin'
                                                ? 'bg-amber-900/40 text-amber-200'
                                                : 'text-gray-300 hover:text-amber-300 hover:bg-gray-800/60'
                                                }`}
                                        >
                                            Admin
                                        </Link>
                                    )}
                                    <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-800">
                                        <div className="w-8 h-8 rounded-full bg-cyan-700 flex items-center justify-center text-white text-sm font-semibold">
                                            {user.name[0].toUpperCase()}
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link href="/auth/login" className={navLinkClass('/auth/login')}>
                                        Login
                                    </Link>
                                    <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden text-gray-300 hover:text-white p-2 rounded-md hover:bg-gray-800/70"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                    aria-controls={menuId}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {menuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div id={menuId} className="md:hidden border-t border-gray-800 bg-gray-950/95 px-4 py-4 flex flex-col gap-2">
                    <Link href="/" className={pathname === '/' ? 'bg-cyan-900/35 text-cyan-200 px-3 py-2 rounded-md' : 'text-gray-300 hover:text-white hover:bg-gray-800/60 px-3 py-2 rounded-md'} onClick={() => setMenuOpen(false)}>Home</Link>
                    {user ? (
                        <>
                            <Link href="/write" className={pathname === '/write' ? 'bg-cyan-900/35 text-cyan-200 px-3 py-2 rounded-md' : 'text-gray-300 hover:text-white hover:bg-gray-800/60 px-3 py-2 rounded-md'} onClick={() => setMenuOpen(false)}>Write</Link>
                            {user.role === 'ADMIN' && (
                                <Link href="/admin" className={pathname === '/admin' ? 'bg-amber-900/35 text-amber-200 px-3 py-2 rounded-md' : 'text-gray-300 hover:text-amber-300 hover:bg-gray-800/60 px-3 py-2 rounded-md'} onClick={() => setMenuOpen(false)}>Admin</Link>
                            )}
                            <button onClick={handleLogout} className="text-left text-gray-300 hover:text-white hover:bg-gray-800/60 px-3 py-2 rounded-md">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className={pathname === '/auth/login' ? 'bg-cyan-900/35 text-cyan-200 px-3 py-2 rounded-md' : 'text-gray-300 hover:text-white hover:bg-gray-800/60 px-3 py-2 rounded-md'} onClick={() => setMenuOpen(false)}>Login</Link>
                            <Link href="/auth/register" className={pathname === '/auth/register' ? 'bg-cyan-900/35 text-cyan-200 px-3 py-2 rounded-md' : 'text-cyan-300 hover:text-cyan-200 hover:bg-gray-800/60 px-3 py-2 rounded-md'} onClick={() => setMenuOpen(false)}>Register</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
