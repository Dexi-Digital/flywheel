'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Bot,
  UserCircle,
  BarChart3,
  Settings,
} from 'lucide-react';
import { getAllAgents } from '@/lib/aggregated-data';
import { Agent } from '@/types/database.types';
import { Avatar } from '@/components/ui/avatar';

const mainNavItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/leads',
    label: 'Leads',
    icon: Users,
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [agents, setAgents] = useState<Agent[]>([]);

  function getAgentHref(agentId: string): string {
    if (agentId === 'agent-vitor') return '/dashboard/vitor';
    if (agentId === 'agent-alice') return '/dashboard/alice';
    if (agentId === 'agent-angela') return '/dashboard/angela';
    if (agentId === 'agent-fernanda') return '/dashboard/fernanda';
    if (agentId === 'agent-luis') return '/dashboard/luis';
    if (agentId === 'agent-iza') return '/dashboard/iza';

    return `/dashboard/agentes/${agentId}`;
  }

  useEffect(() => {
    async function loadAgents() {
      try {
        const allAgents = await getAllAgents();
        // Ensure required agents are present and sort alphabetically.
        const required = [
          { id: 'agent-luis', nome: 'Luis' },
          { id: 'agent-angela', nome: 'Angela' },
          { id: 'agent-alice', nome: 'Alice' },
          { id: 'agent-fernanda', nome: 'Fernanda' },
          { id: 'agent-iza', nome: 'Iza' },
          { id: 'agent-vitor', nome: 'Vitor' },
        ];

        const filtered = allAgents.filter((a) => a.tipo !== 'GOVERNANCA');

        const map = new Map<string, Agent>();
        filtered.forEach(a => map.set(a.id, a));

        // Merge required agents (do not overwrite fetched data if exists)
        required.forEach(r => {
          if (!map.has(r.id)) {
            map.set(r.id, {
              id: r.id,
              nome: r.nome,
              tipo: 'PILOT' as any,
              status: 'ATIVO' as any,
              avatar_url: undefined,
              metricas_agregadas: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              leads: [],
              events: [],
            } as Agent);
          }
        });

        // Create array and sort by name (pt-BR)
        const merged = Array.from(map.values()).sort((x, y) =>
          (x.nome || '').localeCompare(y.nome || '', 'pt-BR')
        );

        setAgents(merged);
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    }
    loadAgents();
  }, []);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            OTTO
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Agents Section */}
        <div className="mt-8">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Agentes
          </h3>
          <div className="space-y-1">
            {agents.map((agent) => {
              const href = getAgentHref(agent.id);
              const isActive =
                pathname === `/dashboard/agentes/${agent.id}` ||
                pathname === href;

              return (
                <Link
                  key={agent.id}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  )}
                >
                  <Avatar name={agent.nome} size="sm" />
                  <span>{agent.nome}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Settings className="h-5 w-5" />
          Configurações
        </Link>
      </div>
    </aside>
  );
}

