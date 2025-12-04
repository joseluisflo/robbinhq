
'use client';

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
        <div className="w-full max-w-sm mx-auto bg-muted/50 rounded-lg p-3 h-48 overflow-hidden shadow-lg">
            <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                <code>{instructions}</code>
            </pre>
        </div>
    );
}
