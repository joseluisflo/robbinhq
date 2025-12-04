
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

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
            <CardContent className="p-4 space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 h-48 overflow-hidden">
                    <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">
                        <code>{instructions}</code>
                    </pre>
                </div>
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="temperature"
                            className="text-sm font-semibold"
                        >
                            Temperature
                        </Label>
                        <span className="text-sm font-medium">0.5</span>
                    </div>
                    <Slider
                        id="temperature"
                        defaultValue={[0.5]}
                        max={1}
                        step={0.1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Consistent</span>
                        <span>Creative</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
