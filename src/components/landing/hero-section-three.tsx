import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroHeader } from './header'
import Image from 'next/image'
import HeroTitle from './hero-title'

export default function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="bg-muted/50 overflow-hidden">
                <HeroTitle />
                <section>
                    <div className="relative pb-14">
                        <div className="mx-auto max-w-5xl px-6">
                            <div className="relative -mr-56 mt-16 sm:mr-0">
                                <div
                                  className="rounded-[var(--radius)] p-4 bg-cover bg-center"
                                  style={{
                                    backgroundImage:
                                      "url('https://assets.tryrobbin.com/assets/home-masthead-bg.webp')",
                                  }}
                                >
                                    <div className="bg-background rounded-md relative mx-auto overflow-hidden border border-transparent shadow-lg shadow-black/10 ring-1 ring-black/10">
                                        <Image
                                            src="/mist/tailark-2.png"
                                            alt="app screen"
                                            width="2880"
                                            height="1842"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}
