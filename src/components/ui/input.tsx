'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
            'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
            'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500',
            'dark:focus:border-blue-400 dark:focus:ring-blue-400',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

