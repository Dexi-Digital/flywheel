'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import { Bot, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/');
      } else {
        setError('Credenciais inválidas. Para demo, use lorrayne@dexidigital.com.br / demo2024');
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Bot className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Command Center
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sistema de Governança OTTO
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
            Credenciais Demo:
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Email: lorrayne@dexidigital.com.br
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Senha: demo2024
          </p>
        </div>
      </Card>
    </div>
  );
}

