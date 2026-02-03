import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    MessageSquare,
    AlertOctagon,
    Brain,
    Inbox,
    Clock,
    ChevronDown,
    Loader2
} from 'lucide-react';
import type { FernandaActivityEvent } from '@/types/fernanda-api.types';

interface ActivityTimelineProps {
    events: FernandaActivityEvent[];
    loading?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
}

const SOURCE_CONFIG = {
    memoria: {
        label: 'Memória',
        icon: Brain,
        color: 'text-purple-600',
        bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    intervencao_humana: {
        label: 'Intervenção',
        icon: AlertOctagon,
        color: 'text-red-600',
        bg: 'bg-red-100 dark:bg-red-900/30',
    },
    curadoria: {
        label: 'Curadoria',
        icon: MessageSquare,
        color: 'text-blue-600',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    buffer_messages: {
        label: 'Fila',
        icon: Inbox,
        color: 'text-amber-600',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
};

export function ActivityTimeline({ events, loading, onLoadMore, hasMore }: ActivityTimelineProps) {
    if (!loading && events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Clock className="h-10 w-10 mb-3 opacity-20" />
                <p>Nenhuma atividade recente encontrada.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[400px]">
                {events.map((event) => {
                    const config = SOURCE_CONFIG[event.source] || SOURCE_CONFIG.memoria;
                    const Icon = config.icon;

                    return (
                        <div key={`${event.source}-${event.id}`} className="flex gap-3 relative group">
                            {/* Linha vertical conectora (exceto no último) */}
                            <div className="absolute left-4 top-8 bottom-[-16px] w-px bg-gray-200 dark:bg-gray-800 group-last:hidden" />

                            <div className={`relative z-10 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${config.bg}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>

                            <div className="flex-1 pb-1">
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${config.color.replace('text-', 'text-opacity-80 text-')}`}>
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {format(new Date(event.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                    </span>
                                </div>

                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mt-0.5">
                                    {event.session_id.split('@')[0]}
                                </h4>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                    {event.summary}
                                </p>
                            </div>
                        </div>
                    );
                })}

                {loading && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                    </div>
                )}
            </div>

            {hasMore && !loading && (
                <button
                    onClick={onLoadMore}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border-t border-gray-100 dark:border-gray-800 pt-4"
                >
                    Carregar mais atividades
                    <ChevronDown className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
