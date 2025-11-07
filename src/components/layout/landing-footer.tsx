import { Github, Twitter, Linkedin } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <Link href="/" className="mb-2 inline-block">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} AgentVerse. All rights reserved.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="#" aria-label="Twitter">
              <Twitter className="h-6 w-6 text-muted-foreground hover:text-foreground" />
            </Link>
            <Link href="#" aria-label="GitHub">
              <Github className="h-6 w-6 text-muted-foreground hover:text-foreground" />
            </Link>
            <Link href="#" aria-label="LinkedIn">
              <Linkedin className="h-6 w-6 text-muted-foreground hover:text-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
