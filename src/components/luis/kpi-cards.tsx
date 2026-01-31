'use client';

import { Card } from '@/components/ui/card';

interface KPIData {
  totalLeads: number;
  contactedLeads: number;
  attendanceTypes: Record<string, number>;
  origins: Record<string, number>;
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  const contactPercentage =
    data.totalLeads > 0 ? Math.round((data.contactedLeads / data.totalLeads) * 100) : 0;

  const topAttendanceType = Object.entries(data.attendanceTypes).sort(([, a], [, b]) => b - a)[0];
  const topOrigin = Object.entries(data.origins).sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Total de Leads</div>
        <div className="text-3xl font-bold text-blue-600">{data.totalLeads}</div>
        <div className="text-xs text-gray-500 mt-2">no período</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Contactados</div>
        <div className="text-3xl font-bold text-green-600">{contactPercentage}%</div>
        <div className="text-xs text-gray-500 mt-2">{data.contactedLeads} de {data.totalLeads}</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Tipo de Atendimento</div>
        <div className="text-2xl font-bold text-purple-600">{topAttendanceType?.[0] || '-'}</div>
        <div className="text-xs text-gray-500 mt-2">{topAttendanceType?.[1] || 0} leads</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Principal Origem</div>
        <div className="text-2xl font-bold text-orange-600">{topOrigin?.[0] || '-'}</div>
        <div className="text-xs text-gray-500 mt-2">{topOrigin?.[1] || 0} leads</div>
      </Card>
    </div>
  );
}
