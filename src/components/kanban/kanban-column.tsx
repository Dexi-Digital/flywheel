'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  title: string;
  count: number;
  color: string;
  children: ReactNode;
}

export function KanbanColumn({ title, count, color, children }: KanbanColumnProps) {
  return (
    <div className="flex min-w-[320px] flex-col rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
      {/* Column Header */}
      <div className={cn('rounded-t-lg border-b border-gray-200 p-4 dark:border-gray-700', color)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {count}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {children}
      </div>
    </div>
  );
}

