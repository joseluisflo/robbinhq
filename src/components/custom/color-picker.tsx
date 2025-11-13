'use client';
import Color from 'color';
import { PipetteIcon } from 'lucide-react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorPickerContextValue {
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  value: string;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setAlpha: (alpha: number) => void;
  internalColor: Color;
  setInternalColor: (color: Color) => void;
}

const ColorPickerContext = createContext<ColorPickerContextValue | undefined>(
  undefined
);

export const useColorPicker = () => {
  const context = useContext(ColorPickerContext);
  if (!context) {
    throw new Error('useColorPicker must be used within a ColorPickerProvider');
  }
  return context;
};

export type ColorPickerProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  value?: Parameters<typeof Color>[0];
  defaultValue?: Parameters<typeof Color>[0];
  onChange?: (value: string) => void;
};

export const ColorPicker = ({
  value: valueProp,
  defaultValue = '#000000',
  onChange,
  className,
  ...props
}: ColorPickerProps) => {
  const [internalColor, setInternalColor] = useState(() => {
    try {
      return Color(valueProp ?? defaultValue, 'hex');
    } catch (e) {
      return Color(defaultValue, 'hex');
    }
  });

  const [hue, setHue] = useState(internalColor.hue() || 0);
  const [saturation, setSaturation] = useState(internalColor.saturationl() || 100);
  const [lightness, setLightness] = useState(internalColor.lightness() || 50);
  const [alpha, setAlpha] = useState(internalColor.alpha() * 100);
  const value = useMemo(() => internalColor.hexa(), [internalColor]);
  
  useEffect(() => {
    if (valueProp !== undefined) {
      try {
        const newColor = Color(valueProp, 'hex');
        if (!newColor.isEqualTo(internalColor)) {
          setInternalColor(newColor);
          setHue(newColor.hue());
          setSaturation(newColor.saturationl());
          setLightness(newColor.lightness());
          setAlpha(newColor.alpha() * 100);
        }
      } catch (e) {
        console.warn('Invalid color prop passed to ColorPicker:', valueProp);
      }
    }
  }, [valueProp, internalColor]);

  useEffect(() => {
    const newColor = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
    const newColorString = newColor.hexa();
    if (onChange && newColorString !== valueProp) {
      onChange(newColorString);
    }
  }, [hue, saturation, lightness, alpha, onChange, valueProp]);
  
  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        lightness,
        alpha,
        value: String(value),
        setHue,
        setSaturation,
        setLightness,
        setAlpha,
        internalColor,
        setInternalColor,
      }}
    >
      <div
        className={cn('flex size-full flex-col gap-4 p-4', className)}
        {...props}
      >
        <ColorPickerSelection className="h-36" />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ColorPickerEyeDropper />
            <ColorPickerFormat />
          </div>
          <div className="flex flex-col gap-3">
            <ColorPickerHue />
            <ColorPickerAlpha />
          </div>
        </div>
      </div>
    </ColorPickerContext.Provider>
  );
};

export type ColorPickerSelectionProps = HTMLAttributes<HTMLDivElement>;

export const ColorPickerSelection = memo(
  ({ className, ...props }: ColorPickerSelectionProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    const { hue, saturation, lightness, setSaturation, setLightness } = useColorPicker();
    
    const positionX = saturation / 100;
    const topLightness = saturation < 1 ? 100 : 50 + 50 * (1 - positionX);
    const positionY = 1 - lightness / topLightness;


    const backgroundGradient = useMemo(() => {
      return `linear-gradient(0deg, rgba(0,0,0,1), rgba(0,0,0,0)),
            linear-gradient(90deg, rgba(255,255,255,1), rgba(255,255,255,0)),
            hsl(${hue}, 100%, 50%)`;
    }, [hue]);

    const handlePointerMove = useCallback(
      (event: PointerEvent) => {
        if (!containerRef.current) {
          return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));

        setSaturation(x * 100);
        const topLightness = x < 0.01 ? 100 : 50 + 50 * (1 - x);
        const newLightness = topLightness * (1 - y);
        setLightness(newLightness);
      },
      [setSaturation, setLightness]
    );
    
    useEffect(() => {
        const handleUp = () => setIsDragging(false);
        if (isDragging) {
            document.addEventListener('pointermove', handlePointerMove);
            document.addEventListener('pointerup', handleUp, { once: true });
        }
        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handleUp);
        };
    }, [isDragging, handlePointerMove]);

    return (
      <div
        className={cn('relative size-full cursor-crosshair rounded', className)}
        onPointerDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          handlePointerMove(e.nativeEvent);
        }}
        ref={containerRef}
        style={{
          background: backgroundGradient,
        }}
        {...props}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white"
          style={{
            left: `${positionX * 100}%`,
            top: `${positionY * 100}%`,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    );
  }
);
ColorPickerSelection.displayName = 'ColorPickerSelection';
export type ColorPickerHueProps = ComponentProps<typeof SliderPrimitive.Root>;
export const ColorPickerHue = ({
  className,
  ...props
}: ColorPickerHueProps) => {
  const { hue, setHue } = useColorPicker();
  return (
    <SliderPrimitive.Root
        className={cn('relative flex h-full w-full touch-none items-center', className)}
        max={360}
        onValueChange={([hue]) => setHue(hue)}
        step={1}
        value={[hue]}
        {...props}
    >
        <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full" style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}>
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
};
export type ColorPickerAlphaProps = ComponentProps<typeof SliderPrimitive.Root>;
export const ColorPickerAlpha = ({
  className,
  ...props
}: ColorPickerAlphaProps) => {
  const { hue, saturation, lightness, alpha, setAlpha } = useColorPicker();
  const color = `hsl(${hue} ${saturation}% ${lightness}%)`;
  return (
    <SliderPrimitive.Root
        className={cn('relative flex h-full w-full touch-none items-center', className)}
        max={100}
        onValueChange={([alpha]) => setAlpha(alpha)}
        step={1}
        value={[alpha]}
        {...props}
    >
        <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full" style={{
          background: `
            linear-gradient(to right, transparent, ${color}),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Cg fill='%23ccc' fill-opacity='1'%3E%3Cpath fill-rule='evenodd' d='M0 0h4v4H0V0zm4 4h4v4H4V4z'/%3E%3C/g%3E%3C/svg%3E")
          `
        }}>
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
};
export type ColorPickerEyeDropperProps = ComponentProps<typeof Button>;
export const ColorPickerEyeDropper = ({
  className,
  ...props
}: ColorPickerEyeDropperProps) => {
  const { setHue, setSaturation, setLightness, setAlpha } = useColorPicker();
  const handleEyeDropper = async () => {
    try {
      // @ts-expect-error - EyeDropper API is experimental
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const color = Color(result.sRGBHex);
      const [h, s, l] = color.hsl().array();
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setAlpha(color.alpha() * 100);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('EyeDropper failed:', error);
      }
    }
  };
  return (
    <Button
      className={cn('shrink-0 text-muted-foreground', className)}
      onClick={handleEyeDropper}
      size="icon"
      variant="outline"
      type="button"
      {...props}
    >
      <PipetteIcon size={16} />
    </Button>
  );
};

type PercentageInputProps = ComponentProps<typeof Input>;
const PercentageInput = ({ className, ...props }: PercentageInputProps) => {
  return (
    <div className="relative">
      <Input
        readOnly
        type="text"
        {...props}
        className={cn(
          'h-8 w-[3.25rem] rounded-l-none bg-secondary px-2 text-xs shadow-none',
          className
        )}
      />
      <span className="-translate-y-1/2 absolute top-1/2 right-2 text-muted-foreground text-xs">
        %
      </span>
    </div>
  );
};
export type ColorPickerFormatProps = HTMLAttributes<HTMLDivElement>;
export const ColorPickerFormat = ({
  className,
  ...props
}: ColorPickerFormatProps) => {
  const { hue, saturation, lightness, alpha } = useColorPicker();
  const color = Color.hsl(hue, saturation, lightness).alpha(alpha / 100);
  const hex = color.hex();
  return (
    <div
      className={cn(
        '-space-x-px relative flex w-full items-center rounded-md shadow-sm',
        className
      )}
      {...props}
    >
      <Input
        className="h-8 rounded-r-none bg-secondary px-2 text-xs shadow-none"
        readOnly
        type="text"
        value={hex}
      />
      <PercentageInput value={Math.round(alpha)} />
    </div>
  );
};
