'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Reminder {
  id: string;
  reminder_type: string;
  scheduled_for: string;
  sent_at?: string;
  status: string;
  content: string;
  lead_id?: string;
}

interface RemindersWidgetProps {
  reminders: Reminder[];
  title?: string;
}

export function RemindersWidget({ reminders, title = 'Próximos Lembretes' }: RemindersWidgetProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'sent': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-blue-100 text-blue-800';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 30) return `${diffDays}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const upcomingReminders = reminders.filter(r => r.status === 'pending').slice(0, 5);
  const sentToday = reminders.filter(
    r =>
      r.sent_at &&
      new Date(r.sent_at).toDateString() === new Date().toDateString(),
  ).slice(0, 5);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">{title}</h3>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {upcomingReminders.length > 0 ? (
            upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="p-3 border rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-sm">{reminder.reminder_type}</div>
                  <Badge className={getStatusColor(reminder.status)}>{reminder.status}</Badge>
                </div>
                <div className="text-sm text-gray-700 mb-2">{reminder.content}</div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Agendado: {formatTime(reminder.scheduled_for)}</span>
                  {reminder.lead_id && <span>Lead: {reminder.lead_id}</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-gray-500">Nenhum lembrete pendente</div>
          )}
        </div>
      </Card>

      {sentToday.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">📤 Enviados Hoje</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {sentToday.map((reminder) => (
              <div key={reminder.id} className="p-3 border rounded text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{reminder.reminder_type}</span>
                  <Badge className={getStatusColor(reminder.status)}>{reminder.status}</Badge>
                </div>
                <div className="text-gray-700 mb-1">{reminder.content}</div>
                {reminder.sent_at && (
                  <div className="text-xs text-gray-500">
                    {new Date(reminder.sent_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
