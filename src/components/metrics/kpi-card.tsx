'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  className,
}: KPICardProps) {
  const isPositive = trend === 'up' || (change !== undefined && change >= 0);
  const showTrend = change !== undefined;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {showTrend && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

