
import { HeroHeader } from '@/components/landing/header';
import FeaturesSix from '@/components/landing/features-6';
import CallToAction from '@/components/landing/call-to-action';
import Footer from '@/components/landing/footer';
import HeroTitle from '@/components/landing/hero-title';

export default function FeaturesPage() {
  const features = [
    {
      title: "Training",
      description: "Provide your agent with knowledge from documents, text, or websites to answer questions accurately."
    },
    {
      title: "Design",
      description: "Customize the look and feel of your chat widget to match your brand identity perfectly."
    },
    {
      title: "Workflows",
      description: "Automate complex, multi-step tasks with a visual editor, no code required."
    },
    {
      title: "Deploy",
      description: "Embed your agent on your website, or connect it to email and phone channels with a single click."
    },
    {
      title: "Chat Logs",
      description: "Review every conversation to gain insights, monitor performance, and identify areas for improvement."
    },
    {
      title: "Lead Search",
      description: "Automatically analyze conversations to identify and extract valuable customer leads."
    }
  ];

  return (
    <>
      <HeroHeader />
      <main className="flex-1">
        <div className="bg-muted/50">
            <HeroTitle />
        </div>
        {features.map((feature, index) => (
          <FeaturesSix key={index} title={feature.title} description={feature.description} />
        ))}
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
