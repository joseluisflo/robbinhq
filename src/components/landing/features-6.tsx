
import { Cpu, Lock, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'
import { AutomationIcon, Chart01Icon, LoDatabaseIcon, LoShieldIcon } from '@/components/lo-icons'
import { cn } from '@/lib/utils';

interface FeatureItem {
    title: string;
    description: string;
    icon: React.ElementType;
}

export default function FeaturesSection({ 
    title = "Foundation features that power your business", 
    description = "Integrated features working seamlessly to ensure better performance, improved clarity, and ongoing growth.",
    featureList,
    variant = "muted",
    layout
}: { 
    title?: string, 
    description?: string,
    featureList?: FeatureItem[],
    variant?: 'muted' | 'white',
    layout?: 'default' | 'center'
}) {
    const defaultFeatures: FeatureItem[] = [
        { title: "Workflows", description: "Automate complex tasks and processes effortlessly.", icon: AutomationIcon },
        { title: "Analytics", description: "Gain powerful insights from every customer interaction.", icon: Chart01Icon },
        { title: "Your Data", description: "Maintain full ownership and control over data.", icon: LoDatabaseIcon },
        { title: "Security", description: "Enterprise-grade protection for all your valuable information.", icon: LoShieldIcon },
    ];

    const featuresToDisplay = featureList || defaultFeatures;

    return (
        <section className={cn("py-16 md:py-32", variant === 'muted' ? 'bg-muted/50' : 'bg-background')}>
            <div className="mx-auto max-w-5xl space-y-12 px-6">
                <div className="relative z-10 grid items-center gap-4 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-medium">{title}</h2>
                    <p className="max-w-sm sm:ml-auto">{description}</p>
                </div>
                <div
                  className="rounded-[var(--radius)] p-4 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://assets.tryrobbin.com/assets/home-masthead-bg.webp')",
                  }}
                >
                    <div className="aspect-88/36 mask-b-from-75% mask-b-to-95% relative">
                        <Image
                            src="/mail-upper.png"
                            className="absolute inset-0 z-10"
                            alt="payments illustration dark"
                            width={2797}
                            height={1137}
                        />
                        <Image
                            src="/mail-back.png"
                            className="hidden dark:block"
                            alt="payments illustration dark"
                            width={2797}
                            height={1137}
                        />
                        <Image
                            src="/mail-back-light.png"
                            className="dark:hidden"
                            alt="payments illustration light"
                            width={2797}
                            height={1137}
                        />
                    </div>
                </div>
                <div className={cn("relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8", 
                    layout === 'center' ? "lg:flex lg:justify-center" : "lg:grid-cols-4"
                )}>
                    {featuresToDisplay.map((feature, index) => (
                         <div key={index} className="space-y-3 lg:max-w-xs">
                            <div className="flex items-center gap-2">
                                <feature.icon variant="duotone" className="size-4" style={{ color: '#00a6f4' }} />
                                <h3 className="text-sm font-medium">{feature.title}</h3>
                            </div>
                            <p className="text-muted-foreground text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
