'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FunnelData } from '@/types/database.types';
import { formatNumber } from '@/lib/utils';

interface FunnelChartProps {
  data: FunnelData[];
  title: string;
}

export function FunnelChart({ data, title }: FunnelChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => {
            const widthPercentage = (item.value / maxValue) * 100;
            const conversionRate =
              index > 0
                ? ((item.value / data[index - 1].value) * 100).toFixed(1)
                : '100';

            return (
              <div key={item.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {item.stage}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatNumber(item.value)}
                    </span>
                    {index > 0 && (
                      <span className="text-xs text-gray-400">
                        ({conversionRate}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-8 w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                    style={{
                      width: `${widthPercentage}%`,
                      backgroundColor: item.fill || '#0f62fe',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Taxa de Conversão Total
          </span>
          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {((data[data.length - 1].value / data[0].value) * 100).toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

