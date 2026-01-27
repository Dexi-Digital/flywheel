'use client';

import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const colorClasses = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-cyan-500',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorClasses.length;
  return colorClasses[index];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  if (src) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
      >
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium text-white',
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
}

