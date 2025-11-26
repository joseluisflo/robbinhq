
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PrivacySettings() {
    const [retention, setRetention] = useState("90");

    const retentionOptions = [
        { value: "30", label: "30 days" },
        { value: "90", label: "90 days" },
        { value: "365", label: "1 year" },
        { value: "forever", label: "Forever" },
    ];

    const getTranslateClass = () => {
        const index = retentionOptions.findIndex(opt => opt.value === retention);
        if (index === -1) return "translate-x-0";
        return `translate-x-[${index * 100}%]`;
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-semibold">Privacy & Visibility</h3>
                <p className="text-sm text-muted-foreground">
                    Manage how your agent's data is stored and who can access it.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Control how visitor data is handled and retained.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="data-retention">Data Retention Policy</Label>
                         <div className="inline-flex h-9 rounded-md bg-input/50 p-0.5">
                            <RadioGroup
                                value={retention}
                                onValueChange={setRetention}
                                className={cn(
                                    "group relative inline-grid items-center gap-0 font-medium text-sm",
                                    "after:absolute after:inset-y-0 after:rounded-sm after:bg-background after:shadow-xs after:transition-[transform] after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)]"
                                )}
                                style={{
                                    gridTemplateColumns: `repeat(${retentionOptions.length}, 1fr)`,
                                    // @ts-ignore
                                    "--tw-translate-x": `${retentionOptions.findIndex(opt => opt.value === retention) * 100}%`,
                                }}
                            >
                                <div className="absolute inset-y-0 h-full w-1/4 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                     style={{ transform: `translateX(${retentionOptions.findIndex(opt => opt.value === retention) * 100}%)` }}>
                                    <div className="h-full w-full rounded-sm bg-background shadow-xs m-0.5"></div>
                                </div>
                                {retentionOptions.map((option) => (
                                     <Label key={option.value} htmlFor={`retention-${option.value}`} className={cn(
                                        "relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors",
                                        retention === option.value ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground"
                                     )}>
                                        {option.label}
                                        <RadioGroupItem value={option.value} id={`retention-${option.value}`} className="sr-only" />
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Conversation logs will be automatically deleted after this period.
                        </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label htmlFor="anonymization-toggle">Anonymize Visitor Data</Label>
                            <p className="text-sm text-muted-foreground">
                                Do not store visitor's personal information (IP, location, etc.).
                            </p>
                        </div>
                        <Switch id="anonymization-toggle" />
                    </div>

                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                            <Label>Export Agent Data</Label>
                            <p className="text-sm text-muted-foreground">
                                Download a CSV file with all conversations and leads.
                            </p>
                        </div>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
