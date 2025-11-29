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
        <FeaturesFour 
            title="Personal AI, with you Anywhere"
            description="Quick AI lives a single hotkey away - ready to quickly appear as a floating window above your other apps. Get instant assistance whether you're browsing, coding, or writing documents."
            card1={{
                title: "Marketing Campaigns",
                description: "Effortlessly plan and execute your marketing campaigns organized.",
                illustration: "code"
            }}
            card2={{
                title: "AI Meeting Scheduler",
                description: "Effortlessly book and manage your meetings. Stay on top of your schedule.",
                illustration: "schedule"
            }}
        />
        <FeaturesFour 
            title="Design and Develop at the Speed of Thought"
            description="Generate code, iterate on designs, and build entire applications with natural language. Our AI understands your intent and helps you ship faster."
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
            title="Automate Workflows and Integrate Services"
            description="Connect your favorite tools and build powerful automations. Let your AI agent handle repetitive tasks so you can focus on what matters."
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