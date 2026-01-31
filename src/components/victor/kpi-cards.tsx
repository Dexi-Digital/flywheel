'use client';

import { Card } from '@/components/ui/card';

interface KPIData {
  totalDebtors: number;
  totalDebt: number;
  contractsOverdue: number;
  averageDaysOverdue: number;
}

interface KPICardsProps {
  data: KPIData;
}

export function VictorKPICards({ data }: KPICardsProps) {
  const avgDebt = data.totalDebtors > 0 ? Math.round(data.totalDebt / data.totalDebtors) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Devedores</div>
        <div className="text-3xl font-bold text-blue-600">{data.totalDebtors}</div>
        <div className="text-xs text-gray-500 mt-2">em acompanhamento</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Total Devido</div>
        <div className="text-2xl font-bold text-red-600">
          R$ {(data.totalDebt / 1000).toFixed(1)}k
        </div>
        <div className="text-xs text-gray-500 mt-2">ticket médio: R$ {avgDebt.toLocaleString('pt-BR')}</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Contratos Atrasados</div>
        <div className="text-3xl font-bold text-orange-600">{data.contractsOverdue}</div>
        <div className="text-xs text-gray-500 mt-2">em atraso</div>
      </Card>

      <Card className="p-4">
        <div className="text-sm text-gray-600 mb-1">Dias Médios</div>
        <div className="text-3xl font-bold text-red-600">{data.averageDaysOverdue}</div>
        <div className="text-xs text-gray-500 mt-2">dias em atraso</div>
      </Card>
    </div>
  );
}
