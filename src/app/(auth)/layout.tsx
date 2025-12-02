import { Logo } from '@/components/layout/logo';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 p-4">
      <div className="mb-6">
        <Link href="/">
          <Logo />
        </Link>
      </div>
      {children}
    </div>
  );
}
