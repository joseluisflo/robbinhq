
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Star, XIcon } from 'lucide-react'
import Link from 'next/link'

const tableData = [
    {
        feature: 'Agents',
        free: '1',
        essential: 'Unlimited',
        pro: 'Unlimited',
    },
    {
        feature: 'Credits',
        free: '150',
        essential: '1,500',
        pro: '5,000',
    },
    {
        feature: 'Workflows',
        free: '3',
        essential: '10',
        pro: '20',
    },
    {
        feature: 'Data training size',
        free: '400kb',
        essential: '40MB',
        pro: '40MB',
    },
    {
        feature: 'Remove Watermark',
        free: false,
        essential: true,
        pro: true,
    },
    {
        feature: 'Video calls',
        free: '',
        essential: '12 Weeks',
        pro: '56',
    },
    {
        feature: 'Support',
        free: '',
        essential: 'Secondes',
        pro: 'Unlimited',
    },
    {
        feature: 'Security',
        free: '',
        essential: '20 Users',
        pro: 'Unlimited',
    },
]

export default function PricingComparator() {
    return (
        <section className="bg-muted py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="w-full overflow-auto lg:overflow-visible">
                    <table className="w-full border-separate border-spacing-x-3 dark:[--color-muted:var(--color-zinc-900)]">
                        <thead className="bg-muted sticky top-[56px] z-10">
                            <tr className="*:py-4 *:text-left *:font-medium">
                                <th className="lg:w-2/5"></th>
                                <th className="space-y-3">
                                    <span className="block">Free</span>

                                    <Button
                                        asChild
                                        variant="neutral">
                                        <Link href="#">Get Started</Link>
                                    </Button>
                                </th>
                                <th className="space-y-3">
                                    <span className="block">Essential</span>
                                    <Button asChild>
                                        <Link href="#">Get Started</Link>
                                    </Button>
                                </th>
                                <th className="space-y-3">
                                    <span className="block">Pro</span>
                                    <Button
                                        asChild
                                        variant="neutral">
                                        <Link href="#">Get Started</Link>
                                    </Button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="*:py-4">
                                <td className="flex items-center gap-2 font-medium">
                                    <Star className="size-4" />
                                    <span>Core</span>
                                </td>
                                <td></td>
                                <td className="border-none px-4"></td>
                                <td></td>
                            </tr>
                            {tableData.slice(0, 5).map((row, index) => (
                                <tr
                                    key={index}
                                    className="*:border-b *:py-4">
                                    <td className="text-muted-foreground">{row.feature}</td>
                                    <td>
                                        {row.free === true ? (
                                            <Check
                                                className="text-primary size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : row.free === false ? (
                                            <XIcon
                                                className="text-muted-foreground/50 size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : (
                                            row.free
                                        )}
                                    </td>
                                    <td>
                                        {row.essential === true ? (
                                            <Check
                                                className="text-primary size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : row.essential === false ? (
                                            <XIcon
                                                className="text-muted-foreground/50 size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : (
                                            row.essential
                                        )}
                                    </td>
                                    <td>
                                        {row.pro === true ? (
                                            <Check
                                                className="text-primary size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : row.pro === false ? (
                                            <XIcon
                                                className="text-muted-foreground/50 size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : (
                                            row.pro
                                        )}
                                    </td>
                                </tr>
                            ))}
                            <tr className="*:pb-4 *:pt-8">
                                <td className="flex items-center gap-2 font-medium">
                                    <Sparkles className="size-4" />
                                    <span>AI Models</span>
                                </td>
                                <td></td>
                                <td className="bg-muted/50 border-none px-4"></td>
                                <td></td>
                            </tr>
                            {tableData.slice(5).map((row, index) => (
                                <tr
                                    key={index}
                                    className="*:border-b *:py-4">
                                    <td className="text-muted-foreground">{row.feature}</td>
                                    <td>
                                        {row.free === true ? (
                                            <Check
                                                className="text-primary size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : (
                                            row.free
                                        )}
                                    </td>
                                    <td>
                                        {row.essential === true ? (
                                            <Check
                                                className="text-primary size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : (
                                            row.essential
                                        )}
                                    </td>
                                    <td>
                                        {row.pro === true ? (
                                            <Check
                                                className="text-primary size-3"
                                                strokeWidth={3.5}
                                            />
                                        ) : (
                                            row.pro
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
