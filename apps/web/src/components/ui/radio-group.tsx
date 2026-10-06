'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RadioGroupContextValue {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function RadioGroup({
  name: controlledName,
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  disabled,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const generatedName = React.useId();
  const name = controlledName ?? generatedName;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;

  const handleChange = React.useCallback(
    (nextVal: string) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(nextVal);
      }
      onValueChange?.(nextVal);
    },
    [controlledValue, onValueChange]
  );

  return (
    <RadioGroupContext.Provider value={{ name, value, onChange: handleChange, disabled }}>
      <div role="radiogroup" className={cn('grid gap-2', className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, disabled, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext);
    if (!ctx) {
      throw new Error('RadioGroupItem must be used within a RadioGroup');
    }

    const isChecked = ctx.value === value;
    const isDisabled = disabled || ctx.disabled;

    return (
      <label
        htmlFor={id}
        className={cn(
          'relative inline-flex items-center cursor-pointer select-none',
          isDisabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          type="radio"
          id={id}
          ref={ref}
          name={ctx.name}
          value={value}
          checked={isChecked}
          onChange={() => ctx.onChange(value)}
          disabled={isDisabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            'size-4 rounded-full border border-slate-300 bg-white transition-all flex items-center justify-center',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-[#844AFB] peer-focus-visible:ring-offset-2',
            isChecked && 'border-[#844AFB]',
            className
          )}
        >
          {isChecked && <div className="size-2 rounded-full bg-[#844AFB]" />}
        </div>
      </label>
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';
