import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const plans = [
    {
        name: 'Free',
        price: '$0 / mo',
        description: 'Per editor',
        features: ['Basic Analytics Dashboard', '5GB Cloud Storage', 'Email and Chat Support'],
        buttonText: 'Get Started',
        variant: 'neutral',
    },
    {
        name: 'Pro',
        price: '$19 / mo',
        description: 'Per editor',
        features: [
            'Everything in Free Plan',
            '5GB Cloud Storage',
            'Email and Chat Support',
            'Access to Community Forum',
            'Single User Access',
            'Access to Basic Templates',
            'Mobile App Access',
            '1 Custom Report Per Month',
            'Monthly Product Updates',
            'Standard Security Features'
        ],
        buttonText: 'Get Started',
        variant: 'default',
        highlight: true,
    },
    {
        name: 'Pro Plus',
        price: '$49 / mo',
        description: 'Per editor',
        features: ['Everything in Pro Plan', '5GB Cloud Storage', 'Email and Chat Support'],
        buttonText: 'Get Started',
        variant: 'neutral',
    },
]

export default function Pricing() {
    return (
        <div className="bg-muted relative py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl">Pricing that scale with your business</h2>
                    <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-lg">Choose the perfect plan for your needs and start optimizing your workflow today</p>
                </div>
                <div className="relative mt-12 md:mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
                    {plans.map((plan, index) => (
                         <Card key={index} className={cn("flex flex-col", plan.highlight && "ring-foreground/10 bg-background rounded-[var(--radius)] -mx-1 border-transparent shadow ring-1 -my-3")}>
                            <CardHeader className="p-8">
                                <CardTitle className="font-medium">{plan.name}</CardTitle>
                                <span className="mb-0.5 mt-2 block text-2xl font-semibold">{plan.price}</span>
                                <CardDescription className="text-sm">{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="border-y px-8 py-4">
                                    <Button
                                        asChild
                                        className="w-full"
                                        variant={plan.variant as any}>
                                        <Link href="#">{plan.buttonText}</Link>
                                    </Button>
                                </div>
                                <ul
                                    role="list"
                                    className="space-y-3 p-8">
                                    {plan.features.map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2">
                                            <Check
                                                className="text-primary size-3"
                                                strokeWidth={3.5}
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
