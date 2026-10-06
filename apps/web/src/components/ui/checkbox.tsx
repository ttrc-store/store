'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked: controlledChecked, defaultChecked = false, onCheckedChange, disabled, ...props }, ref) => {
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(defaultChecked);
    const isChecked = controlledChecked ?? uncontrolledChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextChecked = e.target.checked;
      if (controlledChecked === undefined) {
        setUncontrolledChecked(nextChecked);
      }
      onCheckedChange?.(nextChecked);
    };

    return (
      <label className={cn('relative inline-flex items-center cursor-pointer select-none', disabled && 'cursor-not-allowed opacity-50')}>
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            'size-4 rounded-md border border-slate-300 bg-white transition-all flex items-center justify-center',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-[#844AFB] peer-focus-visible:ring-offset-2',
            isChecked && 'bg-[#844AFB] border-[#844AFB] text-white',
            className
          )}
        >
          {isChecked && <Check className="size-3 stroke-[3]" />}
        </div>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
