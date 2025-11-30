
'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HeroHeader } from '@/components/landing/header';

export default function PricingPage() {
  return (
    <>
      <HeroHeader />
      <main className="flex-1">
        <section className="bg-background py-16 md:py-32">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <h1 className="text-5xl font-medium lg:text-6xl">
              Choose your plan
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start with our free plan and upgrade as you grow.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
