import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroHeader } from './header'
import Image from 'next/image'
import HeroTitle from './hero-title'
import { MockupHeroTraining } from './mockup-hero-training'

export default function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="bg-muted/50 overflow-hidden">
                <HeroTitle />
                <section>
                    <div className="relative pb-14">
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="relative mt-16">
                                <div
                                  className="rounded-[var(--radius)] p-8 bg-cover bg-center"
                                  style={{
                                    backgroundImage:
                                      "url('https://assets.tryrobbin.com/assets/home-masthead-bg.webp')",
                                  }}
                                >
                                    <div 
                                        className="mx-auto overflow-hidden"
                                        style={{
                                            maxWidth: '1400px',
                                            zoom: 0.7,
                                        }}
                                    >
                                        <div className="bg-background rounded-lg relative overflow-hidden border border-border shadow-2xl ring-1 ring-black/5">
                                            <MockupHeroTraining />
                                        </div>
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
