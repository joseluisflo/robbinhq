import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    alt?: string;
}

export function Logo({ 
    className, 
    width = 120, 
    height = 24,
    alt = "Robbin logo" 
}: LogoProps) {
  return (
    <Image
      src="https://assets.tryrobbin.com/assets/logo_robbin%20(4).svg"
      alt={alt}
      width={width}
      height={height}
      className={cn('dark:invert', className)}
    />
  );
}
