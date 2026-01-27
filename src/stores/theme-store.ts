import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',

      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        if (typeof window !== 'undefined') {
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        }
      },
    }),
    {
      name: 'command-center-theme',
    }
  )
);

