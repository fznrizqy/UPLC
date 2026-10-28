'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to login immediately if unauthenticated
  React.useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      window.location.replace('/login');
    }
  }, [loading, user, pathname]);

  // Don't render sidebar & header on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (loading) {
    // If on login page, let login page render immediately without waiting
    if (pathname === '/login') {
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-medium text-slate-600">Memuat UPLC...</div>
        </div>
      </div>
    );
  }

  // Not logged in and not on login page
  if (!user) {
    if (pathname !== '/login') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm font-medium text-slate-600">Mengarahkan ke halaman login...</div>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[#F4F6FA] w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full h-full overflow-hidden">
        <Header />
        <main
          key={pathname}
          className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto animate-page-entrance max-w-full"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
