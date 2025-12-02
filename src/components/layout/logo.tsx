import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="https://assets.tryrobbin.com/assets/logo_robbin%20(4).svg"
      alt="AgentVerse logo"
      width={120}
      height={24}
      className={cn('dark:invert', className)}
    />
  );
}
