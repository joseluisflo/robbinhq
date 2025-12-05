

'use client';

import HeroSection from '@/components/landing/hero-section-three';
import FeaturesFour from '@/components/landing/features-four';
import Testimonials from '@/components/landing/testimonials';
import FeaturesSix from '@/components/landing/features-6';
import ContentThree from '@/components/landing/content-3';
import CallToAction from '@/components/landing/call-to-action';
import { MockupKnowledgeBase } from '@/components/landing/mockup-knowledge-base';
import { MockupAgentPersonality } from '@/components/landing/mockup-agent-personality';
import { MockupTemperatureSlider } from '@/components/landing/mockup-temperature-slider';
import Footer from '@/components/landing/footer';


export default function Home() {
  
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <HeroSection />
        <FeaturesFour 
            title="First: Give Your Agent a Brain"
            description="Upload documents, paste text, or connect your knowledge bases. Your agent learns instantly, no code required."
            card1={{
                title: "Knowledge Base",
                description: "Upload documents, spreadsheets, and text to build your agent's knowledge.",
                illustration: <MockupKnowledgeBase />
            }}
            card2={{
                title: "Agent Personality",
                description: "Define your agent's role, persona, and creativity level to match your brand's voice.",
                illustration: (
                  <div className="relative w-full max-w-sm mx-auto">
                    <MockupTemperatureSlider className="absolute -top-8 right-0 z-10 origin-top-right scale-50" />
                    <MockupAgentPersonality />
                  </div>
                )
            }}
        />
        <FeaturesFour 
            title="Your Agent, Your Brand"
            description="Customize colors, logos, and the widget's position. Make your AI agent blend seamlessly with your brand identity."
            card1={{
                title: "Component Generation",
                description: "Describe the component you need, and let the AI write the code for you.",
                illustration: "schedule"
            }}
            card2={{
                title: "Iterative Design",
                description: "Refine your UI/UX with simple prompts, making design changes in seconds.",
                illustration: "code"
            }}
        />
        <FeaturesFour 
            title="You're Ready: Deploy with a Click"
            description="Embed your agent on your website, connect it to an email, or a phone number. Serve your customers wherever they are."
            card1={{
                title: "Service Integration",
                description: "Connect to APIs and services like Stripe, Twilio, and more with ease.",
                illustration: "code"
            }}
            card2={{
                title: "Custom Workflows",
                description: "Build complex, multi-step automations that run on their own.",
                illustration: "schedule"
            }}
        />
        <Testimonials />
        <FeaturesSix />
        <ContentThree />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
