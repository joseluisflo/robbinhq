
import { Button } from '@/components/ui/button'
import { Check, XIcon } from 'lucide-react'
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
        feature: 'Data retention',
        free: '30 Days',
        essential: 'Unlimited',
        pro: 'Unlimited',
    },
    {
        feature: 'Analytics',
        free: true,
        essential: true,
        pro: true,
    },
    {
        feature: 'Lead search',
        free: true,
        essential: true,
        pro: true,
    },
    {
        feature: 'Chat logs',
        free: true,
        essential: true,
        pro: true,
    },
    {
        feature: 'Widget',
        free: true,
        essential: true,
        pro: true,
    },
    {
        feature: 'Email',
        free: true,
        essential: true,
        pro: true,
    },
    {
        feature: 'Phone',
        free: false,
        essential: false,
        pro: true,
    },
]

export default function PricingComparator() {
    return (
        <section className="bg-background py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="w-full overflow-auto lg:overflow-visible">
                    <table className="w-full border-separate border-spacing-x-3">
                        <thead className="sticky top-[56px] z-10 bg-background">
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
                                <td className="font-medium">
                                    Core
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
                                <td className="font-medium">
                                    Activity
                                </td>
                                <td></td>
                                <td className="border-none px-4"></td>
                                <td></td>
                            </tr>
                            {tableData.slice(5, 9).map((row, index) => (
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
                            <tr className="*:pb-4 *:pt-8">
                                <td className="font-medium">
                                    Deploy
                                </td>
                                <td></td>
                                <td className="border-none px-4"></td>
                                <td></td>
                            </tr>
                            {tableData.slice(9).map((row, index) => (
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
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
