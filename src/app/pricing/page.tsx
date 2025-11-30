'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HeroHeader } from '@/components/landing/header';
import PricingSectionTwo from '@/components/landing/pricing-section-two';
import PricingComparatorOne from '@/components/landing/pricing-comparator-one';
import FAQs from '@/components/landing/faqs-section-two';
import CallToAction from '@/components/landing/call-to-action';
import Footer from '@/components/landing/footer';


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
        <PricingSectionTwo />
        <PricingComparatorOne />
        <FAQs />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
