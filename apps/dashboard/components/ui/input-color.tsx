'use client';

import * as React from 'react';

import {
  ColorPicker,
  DEFAULT_COLOR,
  hexToHsva,
  isValidHex,
  parseColor
} from '@/components/ui/color-picker';
import {
  InputWithAdornments,
  InputWithAdornmentsProps
} from '@/components/ui/input-with-adornments';

type InputColorProps = Omit<
  InputWithAdornmentsProps,
  'value' | 'color' | 'onChange'
> & {
  value?: string;
  onChange?: (color: string) => void;
};

export function InputColor({
  value = DEFAULT_COLOR,
  onChange,
  disabled,
  placeholder,
  ...other
}: InputColorProps): React.JSX.Element {
  const [inputValue, setInputValue] = React.useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const debouncedOnChange = React.useCallback(
    (newColor: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onChange?.(newColor);
      }, 100);
    },
    [onChange]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (isValidHex(newValue)) {
        debouncedOnChange(newValue);
      }
    },
    [debouncedOnChange]
  );

  const handleInputBlur = React.useCallback(() => {
    const parsedColor = parseColor(hexToHsva(inputValue));
    if (parsedColor) {
      setInputValue(parsedColor.hex);
      onChange?.(parsedColor.hex);
    } else {
      setInputValue(value);
    }
  }, [inputValue, onChange, value]);

  const handlePickerChange = React.useCallback(
    (hex: string) => {
      onChange?.(hex);
    },
    [onChange]
  );

  return (
    <InputWithAdornments
      startAdornment={
        <ColorPicker
          value={value}
          onChange={handlePickerChange}
          disabled={disabled}
          className="-ml-2.5"
        />
      }
      type="text"
      placeholder={placeholder}
      value={inputValue}
      onChange={handleInputChange}
      onBlur={handleInputBlur}
      disabled={disabled}
      {...other}
    />
  );
}
InputColor.displayName = 'InputColor';
