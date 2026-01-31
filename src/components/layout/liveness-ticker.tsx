'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  agent: string;
  action: string;
  location: string;
  time: string;
}

const MOCK_LOGS: LogEntry[] = [
  { id: '1', agent: 'Iza', action: 'respondeu lead', location: 'Belo Horizonte', time: 'Há 2s' },
  { id: '2', agent: 'Alice', action: 'agendou follow-up', location: 'São Paulo', time: 'Há 15s' },
  { id: '3', agent: 'Fernanda', action: 'reativou lead', location: 'Curitiba', time: 'Há 45s' },
  { id: '4', agent: 'Victor', action: 'confirmou promessa', location: 'Rio de Janeiro', time: 'Há 1m' },
  { id: '5', agent: 'Angela', action: 'resolveu dúvida', location: 'Porto Alegre', time: 'Há 2m' },
];

export function LivenessTicker() {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates by rotating logs
      setLogs((prev) => {
        const newLogs = [...prev];
        const last = newLogs.pop()!;
        return [last, ...newLogs];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 bg-gray-900 px-4 py-2 text-white overflow-hidden border-b border-gray-800">
      <div className="flex items-center gap-2 text-blue-400 font-bold whitespace-nowrap border-r border-gray-700 pr-4">
        <Zap className="h-4 w-4 fill-current" />
        <span className="text-xs uppercase tracking-wider">Liveness Log</span>
      </div>
      
      <div className="flex-1 overflow-hidden relative h-6">
        <div className="flex gap-8 animate-marquee whitespace-nowrap absolute">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-2 text-sm">
              <span className="font-bold text-blue-400">[{log.agent}]</span>
              <span className="text-gray-300">{log.action}</span>
              <span className="text-gray-500">{log.location}</span>
              <span className="text-blue-400/70 font-mono text-xs">- {log.time}</span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {logs.map((log) => (
            <div key={`dup-${log.id}`} className="flex items-center gap-2 text-sm">
              <span className="font-bold text-blue-400">[{log.agent}]</span>
              <span className="text-gray-300">{log.action}</span>
              <span className="text-gray-500">{log.location}</span>
              <span className="text-blue-400/70 font-mono text-xs">- {log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
