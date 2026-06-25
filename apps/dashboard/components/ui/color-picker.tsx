'use client';

import * as React from 'react';
import { CaretSortIcon } from '@radix-ui/react-icons';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Colors

export const DEFAULT_COLOR = '#888888';
export const RGB_MAX = 255;
export const SV_MAX = 100;

export type HSV = { h: number; s: number; v: number };
export type HSVA = HSV & { a: number };
export type RGB = { r: number; g: number; b: number };
export type RGBA = RGB & { a: number };
export type HSL = { h: number; s: number; l: number };
export type HSLA = HSL & { a: number };

export type ColorResult = {
  rgb: RGB;
  hsl: HSL;
  hsv: HSV;
  rgba: RGBA;
  hsla: HSLA;
  hsva: HSVA;
  hex: string;
  hexa: string;
};

export function rgbaToHsva({ r, g, b, a }: RGBA): HSVA {
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  const hh = delta
    ? max === r
      ? (g - b) / delta
      : max === g
        ? 2 + (b - r) / delta
        : 4 + (r - g) / delta
    : 0;

  return {
    h: 60 * (hh < 0 ? hh + 6 : hh),
    s: max ? (delta / max) * SV_MAX : 0,
    v: (max / RGB_MAX) * SV_MAX,
    a
  };
}

export function hsvaToHslaString(hsva: HSVA): string {
  const { h, s, l, a } = hsvaToHsla(hsva);
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

export function hslaToHsva({ h, s, l, a }: HSLA): HSVA {
  s *= (l < 50 ? l : SV_MAX - l) / SV_MAX;
  return {
    h: h,
    s: s > 0 ? ((2 * s) / (l + s)) * SV_MAX : 0,
    v: l + s,
    a
  };
}

export function hsvaToHsla({ h, s, v, a }: HSVA): HSLA {
  const hh = ((200 - s) * v) / SV_MAX;
  return {
    h,
    s:
      hh > 0 && hh < 200
        ? ((s * v) / SV_MAX / (hh <= SV_MAX ? hh : 200 - hh)) * SV_MAX
        : 0,
    l: hh / 2,
    a
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const bin = (r << 16) | (g << 8) | b;
  return `#${bin.toString(16).padStart(6, '0')}`;
}

export function rgbaToHex({ r, g, b, a }: RGBA): string {
  const rgb = rgbToHex({ r, g, b });
  const alpha = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');
  return `${rgb}${alpha}`;
}

export function rgbaToHexa({ r, g, b, a }: RGBA): string {
  const toHex = (value: number) =>
    Math.round(value).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(Math.round(a * 255))}`;
}

export function hexToHsva(hex: string): HSVA {
  return rgbaToHsva(hexToRgba(hex));
}

export function hexToRgba(hex: string): RGBA {
  const htemp = hex.replace('#', '');
  if (/^#?/.test(hex) && htemp.length === 3) {
    hex = `#${htemp.charAt(0)}${htemp.charAt(0)}${htemp.charAt(1)}${htemp.charAt(1)}${htemp.charAt(2)}${htemp.charAt(2)}`;
  }
  const reg = new RegExp(`[A-Za-z0-9]{2}`, 'g');
  const [r, g, b = 0, a] = hex.match(reg)!.map((v) => parseInt(v, 16));
  return {
    r,
    g,
    b,
    a: (a ?? 255) / RGB_MAX
  };
}

export function hsvaToRgba({ h, s, v, a }: HSVA): RGBA {
  const _h = h / 60;
  const _s = s / SV_MAX;
  let _v = v / SV_MAX;
  const hi = Math.floor(_h) % 6;

  const f = _h - Math.floor(_h),
    _p = RGB_MAX * _v * (1 - _s),
    _q = RGB_MAX * _v * (1 - _s * f),
    _t = RGB_MAX * _v * (1 - _s * (1 - f));
  _v *= RGB_MAX;
  const rgba = {} as RGBA;
  switch (hi) {
    case 0:
      rgba.r = _v;
      rgba.g = _t;
      rgba.b = _p;
      break;
    case 1:
      rgba.r = _q;
      rgba.g = _v;
      rgba.b = _p;
      break;
    case 2:
      rgba.r = _p;
      rgba.g = _v;
      rgba.b = _t;
      break;
    case 3:
      rgba.r = _p;
      rgba.g = _q;
      rgba.b = _v;
      break;
    case 4:
      rgba.r = _t;
      rgba.g = _p;
      rgba.b = _v;
      break;
    case 5:
      rgba.r = _v;
      rgba.g = _p;
      rgba.b = _q;
      break;
  }
  rgba.r = Math.round(rgba.r);
  rgba.g = Math.round(rgba.g);
  rgba.b = Math.round(rgba.b);
  return { ...rgba, a };
}

export function hsvaToRgbaString(hsva: HSVA): string {
  const { r, g, b, a } = hsvaToRgba(hsva);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function rgbaToRgb({ r, g, b }: RGBA): RGB {
  return { r, g, b };
}

export function hslaToHsl({ h, s, l }: HSLA): HSL {
  return { h, s, l };
}

export function hsvaToHex(hsva: HSVA): string {
  return rgbaToHex(hsvaToRgba(hsva));
}

export function hsvaToHexa(hsva: HSVA): string {
  return rgbaToHexa(hsvaToRgba(hsva));
}

export function hsvaToHsv({ h, s, v }: HSVA): HSV {
  return { h, s, v };
}

export function parseColor(str: string | HSVA): ColorResult {
  let rgb!: RGB;
  let hsl!: HSL;
  let hsv!: HSV;
  let rgba!: RGBA;
  let hsla!: HSLA;
  let hsva!: HSVA;
  let hex!: string;
  let hexa!: string;
  if (typeof str === 'string' && isValidHex(str)) {
    hsva = hexToHsva(str);
    hex = str;
  } else if (typeof str !== 'string') {
    hsva = str;
  }
  if (hsva) {
    hsv = hsvaToHsv(hsva);
    hsla = hsvaToHsla(hsva);
    rgba = hsvaToRgba(hsva);
    hexa = rgbaToHexa(rgba);
    hex = hsvaToHex(hsva);
    hsl = hslaToHsl(hsla);
    rgb = rgbaToRgb(rgba);
  }
  return { rgb, hsl, hsv, rgba, hsla, hsva, hex, hexa };
}

export function isValidHex(hex: string): boolean {
  return /^#?([A-Fa-f0-9]{3,4}){1,2}$/.test(hex);
}

function getNumberValue(value: string): number {
  return Number(String(value).replace(/%/g, ''));
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key as K))
  ) as Omit<T, K>;
}

// Pointer

type PointerProps = React.HTMLAttributes<HTMLDivElement> & {
  left?: string;
  top?: string;
  fillProps?: React.HTMLAttributes<HTMLDivElement>;
};
const Pointer = ({
  left,
  top,
  className,
  style,
  fillProps = {},
  ...other
}: PointerProps): React.JSX.Element => {
  return (
    <div
      className={cn('absolute', className)}
      style={{
        ...style,
        left,
        top
      }}
      {...other}
    >
      <div
        className="size-4 -translate-y-px translate-x-[-8px] rounded-full bg-gray-200 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.37)]"
        {...omit(fillProps, ['className'])}
      />
    </div>
  );
};

// Interactive

function useEventCallback<T, K>(
  handler?: (value: T, event: K) => void
): (value: T, event: K) => void {
  const callbackRef = React.useRef(handler);

  React.useEffect(() => {
    callbackRef.current = handler;
  });

  return React.useCallback(
    (value: T, event: K) =>
      callbackRef.current && callbackRef.current(value, event),
    []
  );
}

function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return 'touches' in event;
}
function preventDefaultMove(event: MouseEvent | TouchEvent): void {
  if (!isTouchEvent(event)) {
    event?.preventDefault?.();
  }
}
function clamp(num: number, min: number = 0, max: number = 1): number {
  return Math.min(Math.max(num, min), max);
}

type Interaction = {
  left: number;
  top: number;
  width: number;
  height: number;
  x: number;
  y: number;
};

const getRelativePosition = (
  node: HTMLDivElement,
  event: MouseEvent | TouchEvent
): Interaction => {
  const rect = node.getBoundingClientRect();
  const pointer = isTouchEvent(event)
    ? event.touches[0]
    : (event as MouseEvent);

  return {
    left: clamp(
      (pointer.pageX - (rect.left + window.pageXOffset)) / rect.width
    ),
    top: clamp((pointer.pageY - (rect.top + window.pageYOffset)) / rect.height),
    width: rect.width,
    height: rect.height,
    x: pointer.pageX - (rect.left + window.pageXOffset),
    y: pointer.pageY - (rect.top + window.pageYOffset)
  };
};

type InteractiveProps = React.HTMLAttributes<HTMLDivElement> & {
  onMove?: (interaction: Interaction, event: MouseEvent | TouchEvent) => void;
  onDown?: (offset: Interaction, event: MouseEvent | TouchEvent) => void;
};
const Interactive = React.forwardRef<HTMLDivElement, InteractiveProps>(
  ({ onMove, onDown, ...other }, _ref) => {
    const container = React.useRef<HTMLDivElement>(null);
    const hasTouched = React.useRef(false);
    const [isDragging, setDragging] = React.useState(false);

    const onMoveCallback = useEventCallback<
      Interaction,
      MouseEvent | TouchEvent
    >(onMove);

    const onKeyCallback = useEventCallback<
      Interaction,
      MouseEvent | TouchEvent
    >(onDown);

    const isValid = (event: MouseEvent | TouchEvent): boolean => {
      if (hasTouched.current && !isTouchEvent(event)) return false;
      hasTouched.current = isTouchEvent(event);
      return true;
    };

    const handleMove = React.useCallback(
      (event: MouseEvent | TouchEvent) => {
        preventDefaultMove(event);
        const isDown = isTouchEvent(event)
          ? event.touches.length > 0
          : event.buttons > 0;
        if (isDown && container.current) {
          onMoveCallback?.(
            getRelativePosition(container.current!, event),
            event
          );
        } else {
          setDragging(false);
        }
      },
      [onMoveCallback]
    );

    const handleMoveEnd = React.useCallback(() => setDragging(false), []);
    const toggleDocumentEvents = React.useCallback((state: boolean) => {
      const toggleEvent = state
        ? window.addEventListener
        : window.removeEventListener;
      toggleEvent(hasTouched.current ? 'touchmove' : 'mousemove', handleMove);
      toggleEvent(hasTouched.current ? 'touchend' : 'mouseup', handleMoveEnd);
      /* eslint-disable  react-hooks/exhaustive-deps */
    }, []);

    React.useEffect(() => {
      toggleDocumentEvents(isDragging);
      return () => {
        if (isDragging) {
          toggleDocumentEvents(false);
        }
      };
    }, [isDragging, toggleDocumentEvents]);

    const handleMoveStart = React.useCallback(
      (event: React.MouseEvent | React.TouchEvent) => {
        preventDefaultMove(event.nativeEvent);
        if (!isValid(event.nativeEvent)) return;
        onKeyCallback?.(
          getRelativePosition(container.current!, event.nativeEvent),
          event.nativeEvent
        );
        setDragging(true);
      },
      [onKeyCallback]
    );

    return (
      <div
        ref={container}
        tabIndex={0}
        style={{
          ...other.style,
          touchAction: 'none'
        }}
        onMouseDown={handleMoveStart}
        onTouchStart={handleMoveStart}
        {...other}
      />
    );
  }
);
Interactive.displayName = 'Interactive';

// Saturation

type SaturationProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  hsva?: HSVA;
  hue?: number;
  onChange?: (newColor: HSVA) => void;
};
const Saturation = React.forwardRef<HTMLDivElement, SaturationProps>(
  ({ hue = 0, hsva, style, onChange, ...other }, ref) => {
    const pointerElement = React.useMemo(() => {
      if (!hsva) return null;
      return (
        <Pointer
          top={`${100 - hsva.v}%`}
          left={`${hsva.s}%`}
          color={hsvaToHslaString(hsva)}
          style={{ transform: 'translate(-1px, -8px)' }}
        />
      );
    }, [hsva]);

    const handleChange = (interaction: Interaction) => {
      if (hsva && onChange) {
        onChange({
          h: hsva.h,
          s: interaction.left * 100,
          v: (1 - interaction.top) * 100,
          a: hsva.a
        });
      }
    };

    return (
      <Interactive
        ref={ref}
        className="relative inset-0 h-[130px] w-full cursor-crosshair"
        style={{
          backgroundImage: `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, hsl(${
            hsva?.h ?? hue
          }, 100%, 50%))`,
          ...style
        }}
        onMove={handleChange}
        onDown={handleChange}
        {...other}
      >
        {pointerElement}
      </Interactive>
    );
  }
);
Saturation.displayName = 'Saturation';

// Alpha

type AlphaProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  width?: React.CSSProperties['width'];
  height?: React.CSSProperties['height'];
  hsva: HSVA;
  background?: string;
  trackProps?: React.HTMLAttributes<HTMLDivElement>;
  interactiveProps?: React.HTMLAttributes<HTMLDivElement>;
  pointerProps?: PointerProps;
  showPointer?: boolean;
  direction?: 'vertical' | 'horizontal';
  onChange?: (newAlpha: { a: number }, offset: Interaction) => void;
};
const Alpha = React.forwardRef<HTMLDivElement, AlphaProps>(
  (
    {
      hsva,
      background,
      trackProps = {},
      interactiveProps = {},
      pointerProps,
      showPointer = true,
      width,
      height = 16,
      direction = 'horizontal',
      className,
      style,
      onChange,
      ...other
    },
    ref
  ) => {
    const handleChange = (offset: Interaction) => {
      onChange?.(
        { ...hsva, a: direction === 'horizontal' ? offset.left : offset.top },
        offset
      );
    };

    const colorTo = hsvaToHslaString(Object.assign({}, hsva, { a: 1 }));
    const innerBackground = `linear-gradient(to ${
      direction === 'horizontal' ? 'right' : 'bottom'
    }, rgba(244, 67, 54, 0) 0%, ${colorTo} 100%)`;
    const posProps: { left?: string; top?: string } = {};
    if (direction === 'horizontal') {
      posProps.left = `${hsva.a * 100}%`;
    } else {
      posProps.top = `${hsva.a * 100}%`;
    }

    return (
      <div
        ref={ref}
        className={cn('relative bg-white', className)}
        style={{
          background:
            'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/nYDCgBDAm9BGDWAAJyRCgLaBCAAgXwixzAS0pgAAAABJRU5ErkJggg==) left center',
          ...{ width, height },
          ...style
        }}
        {...other}
      >
        <div
          className={cn('absolute inset-0', trackProps.className)}
          style={{
            background: background || innerBackground,
            ...trackProps.style
          }}
          {...omit(trackProps, ['className', 'style'])}
        />
        <Interactive
          className={cn(
            'absolute inset-0 z-[1] cursor-crosshair',
            interactiveProps.className
          )}
          onMove={handleChange}
          onDown={handleChange}
          {...omit(interactiveProps, ['className'])}
        >
          {showPointer && (
            <Pointer
              {...pointerProps}
              {...posProps}
            />
          )}
        </Interactive>
      </div>
    );
  }
);
Alpha.displayName = 'Alpha';

// Hue

type HueProps = Omit<AlphaProps, 'hsva' | 'onChange'> & {
  onChange?: (newHue: { h: number }) => void;
  hue?: number;
};
const Hue = React.forwardRef<HTMLDivElement, HueProps>(
  ({ hue = 0, onChange, direction = 'horizontal', ...other }, ref) => {
    return (
      <Alpha
        ref={ref}
        direction={direction}
        background={`linear-gradient(to ${
          direction === 'horizontal' ? 'right' : 'bottom'
        }, rgb(255, 0, 0) 0%, rgb(255, 255, 0) 17%, rgb(0, 255, 0) 33%, rgb(0, 255, 255) 50%, rgb(0, 0, 255) 67%, rgb(255, 0, 255) 83%, rgb(255, 0, 0) 100%)`}
        hsva={{ h: hue, s: 100, v: 100, a: hue / 360 }}
        onChange={(_, interaction) => {
          onChange?.({
            h:
              direction === 'horizontal'
                ? 360 * interaction.left
                : 360 * interaction.top
          });
        }}
        {...other}
      />
    );
  }
);
Hue.displayName = 'Hue';

// EyeDropper

const isEyeDropperSupported =
  typeof window !== 'undefined' && 'EyeDropper' in window;
type EyeDropperProps = {
  onPickColor?: (color: string) => void;
};
function EyeDropper(props: EyeDropperProps): React.JSX.Element {
  const handleClick = () => {
    if (isEyeDropperSupported) {
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      const eyeDropper = new (window as any).EyeDropper();
      /* eslint-disable  @typescript-eslint/no-explicit-any */
      eyeDropper.open().then((result: any) => {
        props.onPickColor?.(result.sRGBHex);
      });
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-4 !bg-transparent text-muted-foreground hover:text-primary"
      onClick={handleClick}
    >
      <svg
        viewBox="0 0 512 512"
        className="size-4 shrink-0"
      >
        <path
          fill="currentColor"
          d="M482.8 29.23c38.9 38.98 38.9 102.17 0 141.17L381.2 271.9l9.4 9.5c12.5 12.5 12.5 32.7 0 45.2s-32.7 12.5-45.2 0l-160-160c-12.5-12.5-12.5-32.7 0-45.2s32.7-12.5 45.2 0l9.5 9.4L341.6 29.23c39-38.974 102.2-38.974 141.2 0zM55.43 323.3 176.1 202.6l45.3 45.3-120.7 120.7c-3.01 3-4.7 7-4.7 11.3V416h36.1c4.3 0 8.3-1.7 11.3-4.7l120.7-120.7 45.3 45.3-120.7 120.7c-15 15-35.4 23.4-56.6 23.4H89.69l-39.94 26.6c-12.69 8.5-29.59 6.8-40.377-4-10.786-10.8-12.459-27.7-3.998-40.4L32 422.3v-42.4c0-21.2 8.43-41.6 23.43-56.6z"
        />
      </svg>
    </Button>
  );
}

// ChromeInput

type ChromeInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange'
> & {
  value?: string | number;
  label?: React.ReactNode;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement>,
    value: string | number
  ) => void;
};
const ChromeInput = React.forwardRef<HTMLInputElement, ChromeInputProps>(
  ({ label, value: initValue, onChange, onBlur, ...other }, ref) => {
    const [value, setValue] = React.useState<string | number | undefined>(
      initValue
    );
    const isFocus = React.useRef(false);

    React.useEffect(() => {
      if (initValue !== value) {
        if (!isFocus.current) {
          setValue(initValue);
        }
      }
      /* eslint-disable  react-hooks/exhaustive-deps */
    }, [initValue]);

    const handleChange = (
      e: React.FocusEvent<HTMLInputElement>,
      valInit?: string
    ) => {
      const value = (valInit || e.target.value).trim().replace(/^#/, '');
      if (isValidHex(value)) {
        onChange?.(e, value);
      }
      const val = getNumberValue(value);
      if (!isNaN(val)) {
        onChange?.(e, val);
      }
      setValue(value);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocus.current = false;
      setValue(initValue);
      onBlur?.(e);
    };

    return (
      <div className="relative flex flex-col items-center gap-1.5 text-xs">
        <input
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete="off"
          onFocus={() => (isFocus.current = true)}
          className="w-full border p-1 text-center text-xs"
          {...other}
        />
        {label && (
          <span className="capitalize text-muted-foreground">{label}</span>
        )}
      </div>
    );
  }
);
ChromeInput.displayName = 'ChromeInput';

type ChromeInputRGBAProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  hsva: HSVA;
  rProps?: ChromeInputProps;
  gProps?: ChromeInputProps;
  bProps?: ChromeInputProps;
  aProps?: false | ChromeInputProps;
  onChange?: (color: ColorResult) => void;
};
const ChromeInputRGBA = React.forwardRef<HTMLDivElement, ChromeInputRGBAProps>(
  ({ hsva, rProps, gProps, bProps, aProps, onChange, ...other }, ref) => {
    const rgba = (hsva ? hsvaToRgba(hsva) : {}) as RGBA;
    function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
      const value = Number(e.target.value);
      if (value && value > 255) {
        e.target.value = '255';
      }
      if (value && value < 0) {
        e.target.value = '0';
      }
    }
    const handleChange = (
      value: string | number,
      type: 'r' | 'g' | 'b' | 'a',
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (typeof value === 'number') {
        if (type === 'a') {
          if (value < 0) value = 0;
          if (value > 100) value = 100;
          onChange?.(parseColor(rgbaToHsva({ ...rgba, a: value / 100 })));
        }
        if (value > 255) {
          value = 255;
          e.target.value = '255';
        }
        if (value < 0) {
          value = 0;
          e.target.value = '0';
        }
        if (type === 'r') {
          onChange?.(parseColor(rgbaToHsva({ ...rgba, r: value })));
        }
        if (type === 'g') {
          onChange?.(parseColor(rgbaToHsva({ ...rgba, g: value })));
        }
        if (type === 'b') {
          onChange?.(parseColor(rgbaToHsva({ ...rgba, b: value })));
        }
      }
    };
    return (
      <div
        ref={ref}
        className="flex flex-row items-center gap-1"
        {...other}
      >
        <ChromeInput
          label="R"
          value={rgba.r || 0}
          onBlur={handleBlur}
          onChange={(e, val) => handleChange(val, 'r', e)}
          {...rProps}
        />
        <ChromeInput
          label="G"
          value={rgba.g || 0}
          onBlur={handleBlur}
          onChange={(e, val) => handleChange(val, 'g', e)}
          {...gProps}
        />
        <ChromeInput
          label="B"
          value={rgba.b || 0}
          onBlur={handleBlur}
          onChange={(e, val) => handleChange(val, 'b', e)}
          {...bProps}
        />
        <ChromeInput
          label="A"
          value={rgba.a ? parseInt(String(rgba.a * 100), 10) : 0}
          onBlur={handleBlur}
          onChange={(e, val) => handleChange(val, 'a', e)}
          {...aProps}
        />
      </div>
    );
  }
);
ChromeInputRGBA.displayName = 'ChromeInputRGBA';

type ChromeInputHSLAProps = Omit<
  ChromeInputRGBAProps,
  'rProps' | 'gProps' | 'bProps'
> & {
  hProps?: ChromeInputRGBAProps['gProps'];
  sProps?: ChromeInputRGBAProps['gProps'];
  lProps?: ChromeInputRGBAProps['gProps'];
  aProps?: ChromeInputRGBAProps['aProps'];
};
const ChromeInputHSLA = React.forwardRef<HTMLDivElement, ChromeInputHSLAProps>(
  ({ hsva, hProps, sProps, lProps, aProps, onChange, ...other }, ref) => {
    const hsla = (hsva ? hsvaToHsla(hsva) : { h: 0, s: 0, l: 0, a: 0 }) as HSLA;
    const handleChange = (
      value: string | number,
      type: 'h' | 's' | 'l' | 'a',
      _e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (typeof value === 'number') {
        if (type === 'h') {
          if (value < 0) value = 0;
          if (value > 360) value = 360;
          onChange?.(parseColor(hslaToHsva({ ...hsla, h: value })));
        }
        if (type === 's') {
          if (value < 0) value = 0;
          if (value > 100) value = 100;
          onChange?.(parseColor(hslaToHsva({ ...hsla, s: value })));
        }
        if (type === 'l') {
          if (value < 0) value = 0;
          if (value > 100) value = 100;
          onChange?.(parseColor(hslaToHsva({ ...hsla, l: value })));
        }
        if (type === 'a') {
          if (value < 0) value = 0;
          if (value > 1) value = 1;
          onChange?.(parseColor(hslaToHsva({ ...hsla, a: value })));
        }
      }
    };
    return (
      <ChromeInputRGBA
        ref={ref}
        hsva={hsva}
        rProps={{
          label: 'H',
          value: Math.round(hsla.h),
          ...hProps,
          onChange: (e, val) => handleChange(val, 'h', e)
        }}
        gProps={{
          label: 'S',
          value: `${Math.round(hsla.s)}%`,
          ...sProps,
          onChange: (e, val) => handleChange(val, 's', e)
        }}
        bProps={{
          label: 'L',
          value: `${Math.round(hsla.l)}%`,
          ...lProps,
          onChange: (e, val) => handleChange(val, 'l', e)
        }}
        aProps={{
          label: 'A',
          value: Math.round(hsla.a * 100) / 100,
          ...aProps,
          onChange: (e, val) => handleChange(val, 'a', e)
        }}
        {...other}
      />
    );
  }
);
ChromeInputHSLA.displayName = 'ChromeInputInputHSLA';

// Chrome

enum ChromeInputType {
  HEXA = 'hexa',
  RGBA = 'rgba',
  HSLA = 'hsla'
}
type ChromeProps = Omit<
  React.HtmlHTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  color?: string | HSVA;
  onChange?: (color: ColorResult) => void;
  inputType?: ChromeInputType;
  showInputs?: boolean;
  showEyeDropper?: boolean;
  showColorPreview?: boolean;
  showHue?: boolean;
  showAlpha?: boolean;
};
const Chrome = React.forwardRef<HTMLDivElement, ChromeProps>(
  (
    {
      color,
      showInputs = true,
      showEyeDropper = true,
      showColorPreview = true,
      showHue = true,
      showAlpha = true,
      inputType = ChromeInputType.HEXA,
      onChange,
      className,
      ...other
    },
    ref
  ) => {
    const hsva = (
      typeof color === 'string' && isValidHex(color)
        ? hexToHsva(color)
        : color || { h: 0, s: 0, l: 0, a: 0 }
    ) as HSVA;
    const handleChange = (hsv: HSVA) => onChange?.(parseColor(hsv));
    const [type, setType] = React.useState(inputType);
    const handleClick = () => {
      switch (type) {
        case ChromeInputType.RGBA:
          setType(ChromeInputType.HSLA);
          break;
        case ChromeInputType.HSLA:
          setType(ChromeInputType.HEXA);
          break;
        case ChromeInputType.HEXA:
          setType(ChromeInputType.RGBA);
          break;
      }
    };
    const handleClickColor = (hex: string) => {
      const result = hexToHsva(hex);
      handleChange({ ...result });
    };
    return (
      <div
        ref={ref}
        className={cn('flex w-60 flex-col', className)}
        {...other}
      >
        <Saturation
          hsva={hsva}
          onChange={(newColor) => {
            handleChange({ ...hsva, ...newColor, a: hsva.a });
          }}
        />
        <div className="flex flex-row items-center gap-2.5 p-4">
          {isEyeDropperSupported && showEyeDropper && (
            <EyeDropper onPickColor={handleClickColor} />
          )}
          {showColorPreview && (
            <Alpha
              width={28}
              height={28}
              hsva={hsva}
              className="rounded-full"
              trackProps={{ style: { background: 'transparent' } }}
              interactiveProps={{
                className:
                  'rounded-full shadow-[inset_0_0_1px_rgba(0,0,0,0.25)]',
                style: { background: hsvaToRgbaString(hsva) }
              }}
              showPointer={false}
            />
          )}
          <div className="flex-1">
            {showHue && (
              <Hue
                hue={hsva.h}
                className="h-3 w-full"
                pointerProps={{ className: 'cursor-ew-resize' }}
                trackProps={{ className: 'rounded-xs' }}
                onChange={(newHue) => {
                  handleChange({ ...hsva, ...newHue });
                }}
              />
            )}
            {showAlpha && (
              <Alpha
                hsva={hsva}
                className="mt-1.5 h-3 w-full"
                pointerProps={{ className: 'cursor-ew-resize' }}
                trackProps={{ className: 'rounded-xs' }}
                onChange={(newAlpha) => {
                  handleChange({ ...hsva, ...newAlpha });
                }}
              />
            )}
          </div>
        </div>
        {showInputs && (
          <div className="flex select-none flex-row items-start gap-1 px-4 pb-4">
            <div className="flex-1">
              {type == ChromeInputType.RGBA && (
                <ChromeInputRGBA
                  hsva={hsva}
                  onChange={(result) => handleChange(result.hsva)}
                />
              )}
              {type === ChromeInputType.HEXA && (
                <ChromeInput
                  label="HEX"
                  value={
                    hsva.a > 0 && hsva.a < 1
                      ? hsvaToHexa(hsva).toLocaleUpperCase()
                      : hsvaToHex(hsva).toLocaleUpperCase()
                  }
                  onChange={(_, value) => {
                    if (typeof value === 'string') {
                      handleChange(
                        hexToHsva(/^#/.test(value) ? value : `#${value}`)
                      );
                    }
                  }}
                />
              )}
              {type === ChromeInputType.HSLA && (
                <ChromeInputHSLA
                  hsva={hsva}
                  onChange={(result) => handleChange(result.hsva)}
                />
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 cursor-pointer rounded transition-colors duration-300"
              onClick={handleClick}
            >
              <CaretSortIcon className="size-4 shrink-0" />
            </Button>
          </div>
        )}
      </div>
    );
  }
);
Chrome.displayName = 'Chrome';

// ColorPicker

export type ColorPickerProps = Omit<ButtonProps, 'value' | 'onChange'> & {
  value?: string;
  onChange?: (color: string) => void;
};
function ColorPicker({
  value = DEFAULT_COLOR,
  onChange,
  className,
  ...other
}: ColorPickerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = React.useState(false);
  const handlePickerChange = React.useCallback(
    (newColor: ColorResult) => {
      onChange?.(newColor.hex);
    },
    [onChange]
  );
  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn('size-8 p-0', className)}
          {...other}
        >
          <div
            className="size-4 rounded border"
            style={{
              backgroundColor: isValidHex(value) ? value : DEFAULT_COLOR
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        sideOffset={5}
      >
        <Chrome
          color={isValidHex(value) ? value : DEFAULT_COLOR}
          onChange={handlePickerChange}
          showAlpha
          showHue
          showColorPreview
          showInputs
          showEyeDropper
        />
      </PopoverContent>
    </Popover>
  );
}
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
