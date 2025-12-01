
import { HeroHeader } from '@/components/landing/header';
import FeaturesSix from '@/components/landing/features-6';
import CallToAction from '@/components/landing/call-to-action';
import Footer from '@/components/landing/footer';
import HeroTitle from '@/components/landing/hero-title';
import { AiChemistryIcon, DatabaseIcon, ShieldIcon, IA01Icon, PenToolIcon } from '@/components/lo-icons';


export default function FeaturesPage() {
  const features = [
    {
      title: "Training",
      description: "Provide your agent with knowledge from documents, text, or websites to answer questions accurately.",
      featureList: [
        {
          title: "Instructions",
          description: "Define your agent's personality and behavior.",
          icon: AiChemistryIcon,
        },
        {
          title: "Sources",
          description: "Upload files and text for knowledge.",
          icon: DatabaseIcon,
        },
        {
          title: "Temperature",
          description: "Control the creativity of AI responses.",
          icon: IA01Icon,
        },
        {
          title: "Rate Limiting",
          description: "Prevent abuse with message and time limits.",
          icon: ShieldIcon,
        },
      ]
    },
    {
      title: "Design",
      description: "Customize the look and feel of your chat widget to match your brand identity perfectly.",
      featureList: [
        {
          title: "Upload your logo",
          description: "Personalize your agent with your own brand logo.",
          icon: PenToolIcon,
        },
        {
          title: "Custom Colors",
          description: "Match your brand's color palette perfectly.",
          icon: PenToolIcon,
        },
        {
          title: "Welcome Message",
          description: "Set a custom greeting for your users.",
          icon: PenToolIcon,
        },
      ]
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
          <FeaturesSix 
            key={index} 
            title={feature.title} 
            description={feature.description}
            featureList={feature.featureList} 
          />
        ))}
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
