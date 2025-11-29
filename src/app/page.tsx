'use client';

import HeroSection from '@/components/landing/hero-section-three';
import FeaturesFour from '@/components/landing/features-four';
import Testimonials from '@/components/landing/testimonials';
import FeaturesSix from '@/components/landing/features-6';
import ContentThree from '@/components/landing/content-3';
import CallToAction from '@/components/landing/call-to-action';
import Footer from '@/components/landing/footer';


export default function Home() {
  
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <FeaturesFour />
        <Testimonials />
        <FeaturesSix />
        <ContentThree />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
