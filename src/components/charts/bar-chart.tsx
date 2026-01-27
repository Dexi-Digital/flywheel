'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface BarChartProps {
  data: Record<string, unknown>[];
  bars: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  title: string;
  height?: number;
  formatAsCurrency?: boolean;
  showLegend?: boolean;
  colors?: string[];
}

export function BarChart({
  data,
  bars,
  xAxisKey,
  title,
  height = 300,
  formatAsCurrency = false,
  showLegend = true,
  colors,
}: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatAsCurrency ? (value) => formatCurrency(value) : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              formatter={(value) =>
                formatAsCurrency && typeof value === 'number' ? formatCurrency(value) : value
              }
            />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />
            )}
            {bars.map((bar, index) => (
              <Bar
                key={bar.dataKey}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.color}
                radius={[4, 4, 0, 0]}
              >
                {colors &&
                  data.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                  ))}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

