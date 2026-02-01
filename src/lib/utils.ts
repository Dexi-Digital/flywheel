import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  const isInteger = Number.isInteger(value);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}


export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatPercentage(value: number, showSign = true): string {
  const sign = showSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getAgentTypeLabel(tipo: string): string {
  const labels: Record<string, string> = {
    'SDR': 'SDR Inbound',
    'BDR': 'BDR Outbound',
    'CSM': 'Customer Success',
    'FINANCEIRO': 'Financeiro/Cobrança',
    'SUPORTE': 'Suporte',
    'WINBACK': 'Win-back/Reativação',
    'GOVERNANCA': 'Governança',
    'PILOT': 'Piloto',
  };
  return labels[tipo] || tipo;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'NOVO': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'EM_CONTATO': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'QUALIFICADO': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'NEGOCIACAO': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'GANHO': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'PERDIDO': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'ESTAGNADO': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'NOVO': 'Novo',
    'EM_CONTATO': 'Em Contato',
    'QUALIFICADO': 'Qualificado',
    'NEGOCIACAO': 'Negociação',
    'GANHO': 'Ganho',
    'PERDIDO': 'Perdido',
    'ESTAGNADO': 'Estagnado',
  };
  return labels[status] || status;
}

/** Máscara de privacidade para nome: uma letra + *** (ex.: J***). Se null/vazio, usa letra aleatória. */
export function maskNameForPrivacy(nome: string | null | undefined): string {
  if (nome != null && String(nome).trim() !== '') {
    const first = String(nome).trim()[0].toUpperCase();
    return `${first}***`;
  }
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  return `${randomLetter}***`;
}

/** Máscara de privacidade para CPF: ***.***.***-XX (mostra só os 2 últimos dígitos). */
export function maskCpf(cpf: string | null | undefined): string {
  if (cpf == null || String(cpf).trim() === '') return '***.***.***-**';
  const digits = String(cpf).replace(/\D/g, '');
  if (digits.length < 2) return '***.***.***-**';
  const lastTwo = digits.slice(-2);
  return `***.***.***-${lastTwo}`;
}

