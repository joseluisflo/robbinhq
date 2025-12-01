
import { HeroHeader } from '@/components/landing/header';
import FeaturesSix from '@/components/landing/features-6';
import CallToAction from '@/components/landing/call-to-action';
import Footer from '@/components/landing/footer';
import HeroTitle from '@/components/landing/hero-title';
import { AiChemistryIcon, DatabaseIcon, ShieldIcon, IA01Icon, PenToolIcon, MotionIcon, RocketIcon, Chat02Icon, ChatSimpleIcon, Phone, FileSearch, History, Search, Inbox } from '@/components/lo-icons';


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
      description: "Automate complex, multi-step tasks with a visual editor, no code required.",
      featureList: [
          {
            title: "Visual Builder",
            description: "Design complex automations with an intuitive drag-and-drop editor.",
            icon: MotionIcon,
          },
          {
            title: "Smart Triggers",
            description: "Automatically start workflows based on user intent keywords.",
            icon: RocketIcon,
          },
          {
            title: "User Interaction",
            description: "Ask questions and present options to guide users.",
            icon: AiChemistryIcon,
          },
          {
            title: "Actions",
            description: "Send emails, SMS messages, or even generate PDFs.",
            icon: PenToolIcon,
          },
      ]
    },
    {
      title: "Deploy",
      description: "Embed your agent on your website, or connect it to email and phone channels with a single click.",
      featureList: [
        {
            title: "Website Widget",
            description: "Embed the agent on your website with one-click.",
            icon: Chat02Icon
        },
        {
            title: "Iframe Embed",
            description: "Integrate the chat interface directly into your website.",
            icon: RocketIcon
        },
        {
            title: "Email Connection",
            description: "Connect your agent to process and answer emails.",
            icon: ChatSimpleIcon
        },
        {
            title: "Phone Number",
            description: "Assign a phone number for voice call interactions.",
            icon: Phone
        },
      ]
    },
    {
      title: "Chat Logs",
      description: "Review every conversation to gain insights, monitor performance, and identify areas for improvement.",
      featureList: [
        {
            title: "Unified Inbox",
            description: "View all chat and email logs in one single inbox.",
            icon: Inbox,
        },
        {
            title: "Full History",
            description: "Review complete conversations between users and your agent.",
            icon: History,
        },
        {
            title: "Insights",
            description: "Get visitor location, device, browser, and conversation source.",
            icon: FileSearch,
        },
        {
            title: "Log Search",
            description: "Quickly find specific conversations by searching for keywords.",
            icon: Search,
        },
      ]
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
