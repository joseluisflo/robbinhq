
import { HeroHeader } from '@/components/landing/header';
import FeaturesSix from '@/components/landing/features-6';
import CallToAction from '@/components/landing/call-to-action';
import Footer from '@/components/landing/footer';

export default function FeaturesPage() {
  return (
    <>
      <HeroHeader />
      <main className="flex-1 pt-24 md:pt-32">
        <FeaturesSix />
        <FeaturesSix />
        <FeaturesSix />
        <FeaturesSix />
        <FeaturesSix />
        <FeaturesSix />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
