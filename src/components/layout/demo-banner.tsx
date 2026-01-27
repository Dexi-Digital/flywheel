'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Search } from 'lucide-react';

export function DemoBanner() {
  const { isDemo } = useAuthStore();

  if (!isDemo) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
      <Search className="h-4 w-4" />
      <span>Modo Demonstração - Dados Simulados</span>
    </div>
  );
}

