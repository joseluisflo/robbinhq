
import { HeroHeader } from '@/components/landing/header';
import FeaturesSix from '@/components/landing/features-6';
import CallToAction from '@/components/landing/call-to-action';
import Footer from '@/components/landing/footer';
import HeroTitle from '@/components/landing/hero-title';

export default function FeaturesPage() {
  const featureTitles = [
    "Training",
    "Design",
    "Workflows",
    "Deploy",
    "Chat Logs",
    "Lead Search"
  ];

  return (
    <>
      <HeroHeader />
      <main className="flex-1">
        <div className="bg-muted/50">
            <HeroTitle />
        </div>
        {featureTitles.map((title, index) => (
          <FeaturesSix key={index} title={title} />
        ))}
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
