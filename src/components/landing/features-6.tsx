import { Cpu, Lock, Sparkles, Zap } from 'lucide-react'
import Image from 'next/image'
import { AutomationIcon, Chart01Icon, DatabaseIcon, ShieldIcon } from '@/components/lo-icons'

export default function FeaturesSection() {
    return (
        <section className="bg-muted/50 py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-12 px-6">
                <div className="relative z-10 grid items-center gap-4 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-medium">The ecosystem that brings our models together</h2>
                    <p className="max-w-sm sm:ml-auto">Build with confidence, knowing you have a robust and secure foundation for your agents.</p>
                </div>
                <div className="px-3 pt-3 md:-mx-8">
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
                <div className="relative mx-auto grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-8 lg:grid-cols-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <AutomationIcon variant="duotone" className="size-4" style={{ color: '#00a6f4' }} />
                            <h3 className="text-sm font-medium">Workflows</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Automate complex tasks and processes effortlessly.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Chart01Icon variant="duotone" className="size-4" style={{ color: '#f48700' }} />
                            <h3 className="text-sm font-medium">Analytics</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Gain powerful insights from every customer interaction.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <DatabaseIcon variant="duotone" className="size-4" style={{ color: '#32e48c' }} />
                            <h3 className="text-sm font-medium">Your Data</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Maintain full ownership and control over data.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ShieldIcon variant="duotone" className="size-4" style={{ color: '#e751aa' }} />
                            <h3 className="text-sm font-medium">Security</h3>
                        </div>
                        <p className="text-muted-foreground text-sm">Enterprise-grade protection for all your valuable information.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
