'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
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
      <label
        className={cn(
          'relative inline-flex items-center cursor-pointer select-none',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          type="checkbox"
          role="switch"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            'w-10 h-6 bg-slate-200 rounded-full transition-colors duration-200 ease-in-out',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-[#844AFB] peer-focus-visible:ring-offset-2',
            isChecked && 'bg-[#844AFB]',
            className
          )}
        >
          <div
            className={cn(
              'size-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out mt-1 ml-1',
              isChecked && 'translate-x-4'
            )}
          />
        </div>
      </label>
    );
  }
);
Switch.displayName = 'Switch';
