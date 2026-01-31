'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EvolutionConfig {
  instance_name: string;
  phone_number: string;
  qr_code?: string;
  status: string;
  is_active: boolean;
}

interface WhatsAppStatusCardProps {
  config?: EvolutionConfig;
}

export function WhatsAppStatusCard({ config }: WhatsAppStatusCardProps) {
  if (!config) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4">📱 WhatsApp do Luis</h3>
        <div className="text-center py-6 text-gray-500">Aguardando configuração...</div>
      </Card>
    );
  }

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (status === 'connected') return 'bg-green-100 text-green-800';
    if (status === 'disconnected') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'connected': '🟢 Conectado',
      'disconnected': '🔴 Desconectado',
      'pending': '🟡 Aguardando QR',
      'error': '❌ Erro',
    };
    return labels[status] || status;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">📱 WhatsApp do Luis</h3>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Número</div>
          <div className="font-mono text-lg font-semibold">{config.phone_number || 'Não configurado'}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">Status</div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={getStatusColor(config.status, config.is_active)}>
              {getStatusLabel(config.status)}
            </Badge>
            <Badge className={config.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
              {config.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>

        {config.status === 'disconnected' && config.qr_code && (
          <div className="border rounded p-3 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">Escaneie o QR Code</div>
            <div className="flex justify-center">
              <img
                src={`data:image/svg+xml;base64,${config.qr_code}`}
                alt="QR Code WhatsApp"
                className="w-32 h-32"
              />
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <div>{config.instance_name}</div>
          {config.status === 'connected' && (
            <div className="text-green-600 mt-1">✓ Pronto para enviar mensagens</div>
          )}
        </div>
      </div>
    </Card>
  );
}
