import { cn } from '@/lib/utils'
import Image from 'next/image'

export const Logo = ({ className, src }: { className?: string, src?: string }) => {
    return (
        <Image
            src={src || "https://assets.tryrobbin.com/assets/logo_robbin%20(4).svg"}
            alt="AgentVerse logo"
            width={src ? 24 : 120}
            height={24}
            className={cn('dark:invert', className)}
        />
    )
}
