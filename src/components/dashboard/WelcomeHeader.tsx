'use client';

interface WelcomeHeaderProps {
    name: string | null | undefined;
}

export function WelcomeHeader({ name }: WelcomeHeaderProps) {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Hi {name || 'there'}</h2>
      <p className="text-muted-foreground">
        here's a quick overview of what's happned in the last 7 days.
      </p>
    </div>
  );
}
