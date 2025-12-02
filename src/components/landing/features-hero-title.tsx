import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FeaturesHeroTitle() {
    return (
        <section>
            <div className="relative pt-32 pb-14">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <h1 className="text-5xl font-medium lg:text-5xl leading-normal">The Complete Platform for Agents</h1>
                        <div className="w-full space-y-6">
                            <p className="text-xl">You are in control. Upload knowledge, train an AI Agent in minutes, deploy easily.</p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="w-full">
                                    <Link href="/signup">
                                        <span className="text-nowrap">Start Building</span>
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
