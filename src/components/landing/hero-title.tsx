import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HeroTitle() {
    return (
        <section>
            <div className="relative pt-32 pb-14">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <h1 className="text-5xl font-medium lg:text-5xl leading-normal">Automate support. Win time.</h1>
                        <div className="w-full space-y-6">
                            <p className="text-xl">Create, train, and deploy AI support agents that respond naturally in minutes.</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="w-full sm:w-auto">
                                    <Link href="/signup">
                                        <span className="text-nowrap">Start Building</span>
                                    </Link>
                                </Button>
                                <Button
                                    key={2}
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto">
                                    <Link href="#link">
                                        <span className="text-nowrap">Request a demo</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
