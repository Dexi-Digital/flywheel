'use client';

import { Card } from '@/components/ui/card';

interface KPIData {
  totalLeads: number;
  newLeadsToday: number;
  newLeadsWeek: number;
  contactPercentage: number;
  qualifiedPercentage: number;
  origins: Record<string, number>;
}

interface KPICardsProps {
  data: KPIData;
}

export function IzaKPICards({ data }: KPICardsProps) {
  const topOrigin = Object.entries(data.origins).sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Leads Novos</div>
        <div className="text-3xl font-bold text-blue-600">{data.newLeadsToday}</div>
        <div className="text-xs text-gray-500 mt-2">hoje / {data.newLeadsWeek} semana</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Contactados</div>
        <div className="text-3xl font-bold text-green-600">{data.contactPercentage}%</div>
        <div className="text-xs text-gray-500 mt-2">do total</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Qualificados</div>
        <div className="text-3xl font-bold text-purple-600">{data.qualifiedPercentage}%</div>
        <div className="text-xs text-gray-500 mt-2">com interesse</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Principal Origem</div>
        <div className="text-2xl font-bold text-orange-600">{topOrigin?.[0] || '-'}</div>
        <div className="text-xs text-gray-500 mt-2">{topOrigin?.[1] || 0} leads</div>
      </Card>
    </div>
  );
}
