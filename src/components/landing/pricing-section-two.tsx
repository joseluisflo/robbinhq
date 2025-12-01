
import { Button } from '@/components/ui/button'
import { Check, XIcon } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StarAward01Icon, StarAward02Icon, StarAward03Icon } from '@/components/lo-icons'

export default function Pricing() {
    return (
        <div className="bg-background relative py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="relative mt-12 md:mt-20">
                    <Card className="lg:max-w-full relative mx-auto max-w-sm">
                        <div className="lg:grid-cols-3 grid">
                            <div>
                                <CardHeader className="p-8">
                                    <CardTitle className="font-medium flex items-center gap-2">
                                        <StarAward02Icon variant="duotone" className="size-7" style={{ color: '#45c775' }} />
                                        Free
                                    </CardTitle>
                                    <span className="mb-0.5 mt-2 block text-2xl font-semibold">$0 / mo</span>
                                    <CardDescription className="text-sm">Per editor</CardDescription>
                                </CardHeader>
                                <div className="px-8 py-4">
                                    <Button
                                        asChild
                                        className="w-full"
                                        variant="neutral">
                                        <Link href="#">Get Started</Link>
                                    </Button>
                                </div>

                                <ul
                                    role="list"
                                    className="space-y-3 p-8">
                                    {[
                                        { text: '150 credits', included: true },
                                        { text: '1 Agent', included: true },
                                        { text: '400KB for Data Training', included: true },
                                        { text: 'Deploy 2 Channel', included: true },
                                        { text: 'Limited Data retention', included: true },
                                        { text: 'Watermark', included: true },
                                    ].map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2">
                                            {item.included ? (
                                                <Check
                                                    className="text-primary size-3"
                                                    strokeWidth={3.5}
                                                />
                                            ) : (
                                                <XIcon
                                                    className="text-muted-foreground/50 size-3"
                                                    strokeWidth={3.5}
                                                />
                                            )}
                                            <span className={!item.included ? 'text-muted-foreground/50' : ''}>{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="ring-foreground/10 bg-background rounded-[var(--radius)] lg:mx-0 lg:-my-3 -mx-1 border-transparent shadow ring-1">
                                <div className="lg:py-3 lg:px-0 relative px-1">
                                    <CardHeader className="p-8">
                                        <CardTitle className="font-medium flex items-center gap-2">
                                            <StarAward01Icon variant="duotone" className="size-7" style={{ color: '#4379ef' }} />
                                            Essential
                                        </CardTitle>
                                        <span className="mb-0.5 mt-2 block text-2xl font-semibold">$15 / mo</span>
                                        <CardDescription className="text-sm">Per editor</CardDescription>
                                    </CardHeader>
                                    <div className="lg:mx-0 -mx-1 px-8 py-4">
                                        <Button
                                            asChild
                                            className="w-full">
                                            <Link href="#">Get Started</Link>
                                        </Button>
                                    </div>

                                    <ul
                                        role="list"
                                        className="space-y-3 p-8">
                                        {[
                                            { text: '1500 Credits', included: true },
                                            { text: 'Unlimited Agents', included: true },
                                            { text: '40MB Training Data', included: true },
                                            { text: '3 Channel Deploy', included: true },
                                            { text: 'Unlimited Data retention', included: true },
                                            { text: 'No Watermark', included: true },
                                        ].map((item, index) => (
                                            <li
                                                key={index}
                                                className="flex items-center gap-2">
                                                <Check
                                                    className="text-primary size-3"
                                                    strokeWidth={3.5}
                                                />
                                                {item.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <CardHeader className="p-8">
                                    <CardTitle className="font-medium flex items-center gap-2">
                                        <StarAward03Icon variant="duotone" className="size-7" style={{ color: '#ef459e' }}/>
                                        Pro
                                    </CardTitle>
                                    <span className="mb-0.5 mt-2 block text-2xl font-semibold">$29 / mo</span>
                                    <CardDescription className="text-sm">Per editor</CardDescription>
                                </CardHeader>
                                <div className="px-8 py-4">
                                    <Button
                                        asChild
                                        className="w-full"
                                        variant="neutral">
                                        <Link href="#">Get Started</Link>
                                    </Button>
                                </div>

                                <ul
                                    role="list"
                                    className="space-y-3 p-8">
                                    {[
                                        { text: '5000 Credits', included: true },
                                        { text: 'Unlimited Agents', included: true },
                                        { text: '40MB Training Data', included: true },
                                        { text: '3 Channel Deploy', included: true },
                                        { text: 'Unlimited Data Retention', included: true },
                                        { text: 'No watermark', included: true },
                                    ].map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2">
                                            <Check
                                                className="text-primary size-3"
                                                strokeWidth={3.5}
                                            />
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
