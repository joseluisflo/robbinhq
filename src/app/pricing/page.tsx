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
        <PricingSectionTwo />
        <PricingComparatorOne />
        <FAQs />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
