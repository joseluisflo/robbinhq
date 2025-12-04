
'use client';

import { Card, CardContent } from '@/components/ui/card';

const instructions = `
### Role
You are a friendly and expert technical support agent for "Innovatech".

### Persona
- Patient and helpful.
- Use clear and simple language.

### Constraints
- Do not offer discounts.
- Escalate to a human if the user asks twice.
`.trim();

export function MockupAgentPersonality() {
    return (
        <Card className="w-full max-w-sm mx-auto shadow-lg">
            <CardContent className="p-4">
                <div className="bg-muted/50 rounded-lg p-3 h-48 overflow-hidden">
                    <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                        <code>{instructions}</code>
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
}
