'use client';

import { cn } from '@/utils/classnames';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95 shadow-lg shadow-blue-500/20',
  ghost: 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10',
  danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
