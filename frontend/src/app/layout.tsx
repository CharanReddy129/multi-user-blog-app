import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevBlog - Multi-User Blog Platform',
  description: 'A collaborative blog platform for software developers to write, learn, and share practical engineering knowledge.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-950">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
