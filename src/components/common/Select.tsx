import { SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/classnames';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</label>}
      <select
        className={cn(
          'rounded-xl border border-white/10 bg-[#1E1E1E] px-4 py-2.5 text-sm text-gray-200 transition-colors',
          'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
          'hover:border-white/20',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
