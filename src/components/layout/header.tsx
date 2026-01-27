'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sun, Moon, LogOut, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Command Center
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        <Button variant="ghost" size="sm" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center gap-3">
          <Avatar name={user?.nome || 'User'} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.nome || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

