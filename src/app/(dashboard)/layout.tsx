'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { DemoBanner } from '@/components/layout/demo-banner';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, setLoading } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [mounted, isLoading, user, router]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DemoBanner />
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

