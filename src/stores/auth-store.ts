import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/database.types';

interface AuthState {
  user: User | null;
  isDemo: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setDemo: (isDemo: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const DEMO_EMAIL = 'lorrayne@dexidigital.com.br';
const DEMO_PASSWORD = 'demo2024';

const DEMO_USER: User = {
  id: 'demo-user-001',
  email: DEMO_EMAIL,
  role: 'admin' as UserRole,
  nome: 'Lorrayne Paraíso',
  created_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isDemo: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setDemo: (isDemo) => set({ isDemo }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        // Demo mode login
        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          set({ 
            user: DEMO_USER, 
            isDemo: true, 
            isLoading: false 
          });
          return true;
        }

        // In production, this would call Supabase Auth
        // For now, only demo login is supported
        set({ isLoading: false });
        return false;
      },

      logout: () => {
        set({ user: null, isDemo: false });
      },
    }),
    {
      name: 'command-center-auth',
      partialize: (state) => ({ 
        user: state.user, 
        isDemo: state.isDemo 
      }),
    }
  )
);

