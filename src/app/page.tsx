import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Bot, Zap, Target } from 'lucide-react';
import { LandingHeader } from '@/components/layout/landing-header';
import { LandingFooter } from '@/components/layout/landing-footer';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

const features = [
  {
    icon: Bot,
    title: 'Intuitive Agent Creation',
    description: 'Design and configure AI agents with a simple, no-code interface. Define their purpose and goals in plain English.',
  },
  {
    icon: Target,
    title: 'Goal-Oriented Tasking',
    description: 'Assign complex tasks and watch your agents plan and execute strategies to achieve their objectives.',
  },
  {
    icon: Zap,
    title: 'Real-Time Monitoring',
    description: 'Track your agents\' progress, view their decision-making process, and get instant results.',
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-headline font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Unleash the Power of Autonomous AI Agents
              </h1>
              <p className="mt-6 text-lg text-foreground/80 md:text-xl">
                AgentVerse provides the tools to build, deploy, and manage intelligent agents that work for you 24/7. Automate tasks, gather insights, and revolutionize your workflow.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/signup">Get Started for Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
          {heroImage && (
             <div className="absolute inset-0 -z-10 h-full w-full">
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="opacity-10"
                  data-ai-hint={heroImage.imageHint}
                />
             </div>
          )}
           <div className="absolute inset-0 -z-20 h-full w-full bg-gradient-to-b from-background to-transparent" />
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-32 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-headline font-bold tracking-tight sm:text-4xl">
                A New Universe of Automation
              </h2>
              <p className="mt-4 text-lg text-foreground/70">
                AgentVerse is more than just a tool—it's a platform for innovation. Here's how we empower you.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col items-center text-center p-6 transform transition-transform duration-300 hover:scale-105 hover:shadow-xl">
                  <CardHeader>
                    <div className="p-4 bg-accent rounded-full inline-block">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground/70">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-headline font-bold tracking-tight sm:text-4xl">
              Ready to Build Your First Agent?
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-foreground/70">
              Join AgentVerse today and start your journey into the future of automation. No credit card required.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/signup">Sign Up Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
