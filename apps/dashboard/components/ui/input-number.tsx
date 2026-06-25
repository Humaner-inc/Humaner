/* eslint-disable jsx-a11y/role-supports-aria-props */
'use client';

import * as React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SpinDirection = 'up' | 'down';
type InputSpinnerElement = HTMLDivElement;
type InputSpinnerProps = {
  onSpin: (direction: SpinDirection) => void;
  className?: string;
  disabled?: boolean;
  initialDelay?: number;
  repeatInterval?: number;
  ariaValueText?: string;
};
const InputSpinner = React.forwardRef<InputSpinnerElement, InputSpinnerProps>(
  (
    {
      onSpin,
      className = '',
      disabled = false,
      initialDelay = 500,
      repeatInterval = 50,
      ariaValueText
    },
    ref
  ) => {
    const spinTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const spinIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

    const startSpinning = React.useCallback(
      (direction: SpinDirection) => {
        if (disabled) return;

        onSpin(direction);

        spinTimerRef.current = setTimeout(() => {
          spinIntervalRef.current = setInterval(
            () => onSpin(direction),
            repeatInterval
          );
        }, initialDelay);
      },
      [disabled, onSpin, initialDelay, repeatInterval]
    );

    const stopSpinning = React.useCallback(() => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
        spinTimerRef.current = null;
      }
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
    }, []);

    React.useEffect(() => {
      return stopSpinning;
    }, [stopSpinning]);

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-[34px] flex-col divide-y rounded-r-md border-l bg-accent',
          className
        )}
        role="spinbutton"
        aria-valuetext={ariaValueText}
      >
        <Button
          tabIndex={-1}
          type="button"
          variant="secondary"
          size="icon"
          className="m-0 flex size-[17px] items-center justify-center rounded-none"
          onPointerDown={() => startSpinning('up')}
          onPointerUp={stopSpinning}
          onPointerLeave={stopSpinning}
          aria-label="Increment"
          disabled={disabled}
        >
          <ChevronUpIcon className="size-3 shrink-0" />
        </Button>
        <Button
          tabIndex={-1}
          type="button"
          variant="secondary"
          size="icon"
          className="m-0 flex size-[17px] items-center justify-center rounded-none"
          onPointerDown={() => startSpinning('down')}
          onPointerUp={stopSpinning}
          onPointerLeave={stopSpinning}
          aria-label="Decrement"
          disabled={disabled}
        >
          <ChevronDownIcon className="size-3 shrink-0" />
        </Button>
      </div>
    );
  }
);
InputSpinner.displayName = 'InputSpinner';

export type InputNumberElement = HTMLInputElement;
export type InputNumberProps = React.InputHTMLAttributes<HTMLInputElement> & {
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  containerClassName?: React.HTMLAttributes<HTMLDivElement>['className'];
};
const InputNumber = React.forwardRef<InputNumberElement, InputNumberProps>(
  (
    {
      unit,
      min,
      max,
      step = 1,
      onValueChange,
      onChange,
      value: propValue,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<number | ''>(
      typeof propValue === 'number' ? propValue : ''
    );
    const inputRef = React.useRef<HTMLInputElement>(null);
    const prevPropValueRef = React.useRef(propValue);

    React.useEffect(() => {
      if (
        typeof propValue === 'number' &&
        propValue !== prevPropValueRef.current
      ) {
        setInternalValue(propValue);
        prevPropValueRef.current = propValue;
      }
    }, [propValue]);

    const triggerOnChange = React.useCallback((newValue: number | '') => {
      if (inputRef.current) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        nativeInputValueSetter?.call(inputRef.current, newValue.toString());
        const event = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    }, []);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue =
          event.target.value === '' ? '' : Number(event.target.value);
        setInternalValue(newValue);
        onChange?.(event);
        if (typeof newValue === 'number' && !isNaN(newValue)) {
          onValueChange?.(newValue);
        }
      },
      [onChange, onValueChange]
    );

    const handleBlur = React.useCallback(() => {
      if (typeof internalValue === 'number') {
        const clampedValue = Math.min(
          max ?? Infinity,
          Math.max(min ?? -Infinity, internalValue)
        );
        setInternalValue(clampedValue);
        triggerOnChange(clampedValue);
        onValueChange?.(clampedValue);
      } else {
        const defaultValue = min ?? 0;
        setInternalValue(defaultValue);
        triggerOnChange(defaultValue);
        onValueChange?.(defaultValue);
      }
    }, [internalValue, min, max, onValueChange, triggerOnChange]);

    const handleSpin = React.useCallback(
      (direction: SpinDirection) => {
        setInternalValue((prevValue) => {
          const currentValue =
            typeof prevValue === 'number' ? prevValue : (min ?? 0);
          const increment = direction === 'up' ? step : -step;
          const newValue = Math.round((currentValue + increment) / step) * step;
          const clampedValue = Math.min(
            max ?? Infinity,
            Math.max(min ?? -Infinity, newValue)
          );
          return clampedValue;
        });
      },
      [step, min, max]
    );

    React.useEffect(() => {
      if (typeof internalValue === 'number') {
        triggerOnChange(internalValue);
        onValueChange?.(internalValue);
      }
    }, [internalValue, triggerOnChange, onValueChange]);

    return (
      <div
        className={cn(
          'grid h-9 max-h-9 items-stretch overflow-hidden rounded-md border border-input shadow-sm',
          'grid-cols-[1fr_auto_auto]',
          containerClassName
        )}
      >
        <input
          ref={ref}
          type="number"
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={
            typeof internalValue === 'number' ? internalValue : undefined
          }
          aria-valuetext={
            typeof internalValue === 'number'
              ? `${internalValue}${unit ? ` ${unit}` : ''}`
              : undefined
          }
          className={cn(
            'col-start-1 row-start-1 h-9 w-full border-0 bg-transparent py-1 text-sm focus-visible:outline-none focus-visible:ring-0',
            unit ? 'pl-3' : 'px-3',
            className
          )}
          {...props}
        />
        {unit && (
          <div className="col-start-2 row-start-1 flex items-center justify-center pl-1 pr-3 text-sm text-muted-foreground">
            {unit}
          </div>
        )}
        <InputSpinner
          onSpin={handleSpin}
          disabled={props.disabled}
          className="col-start-3 row-start-1"
          ariaValueText={
            typeof internalValue === 'number'
              ? `${internalValue}${unit ? ` ${unit}` : ''}`
              : undefined
          }
        />
      </div>
    );
  }
);
InputNumber.displayName = 'InputNumber';

export { InputNumber };
