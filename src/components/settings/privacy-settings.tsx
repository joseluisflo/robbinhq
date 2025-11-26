
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
    
    const selectedIndex = retentionOptions.findIndex(o => o.value === retention);


    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-2xl font-semibold">Privacy & Visibility</h3>
                <p className="text-sm text-muted-foreground">
                    Manage how your agent's data is stored and who can access it.
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-semibold">Data Management</h4>
                    <p className="text-sm text-muted-foreground">Control how visitor data is handled and retained.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="data-retention">Data Retention Policy</Label>
                        <div className="w-full">
                        <RadioGroup
                            value={retention}
                            onValueChange={setRetention}
                            className="relative grid grid-cols-4 items-center justify-center rounded-lg bg-muted p-1 text-center font-medium text-sm after:absolute after:inset-0 after:z-0 after:p-1"
                            style={{
                                '--translate-x': `${selectedIndex * 25}%`,
                                '--width-x': '25%',
                            } as React.CSSProperties}
                        >
                            <div className="absolute inset-0 z-0 p-1">
                                <div className="h-full w-[--width-x] rounded-md bg-background shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                        style={{ transform: `translateX(var(--translate-x))` }}
                                />
                            </div>
                            {retentionOptions.map((option) => (
                                    <Label 
                                    key={option.value}
                                    htmlFor={`retention-${option.value}`}
                                    className={cn(
                                        "relative z-10 flex h-full cursor-pointer select-none items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                                        retention === option.value ? "text-foreground" : "text-muted-foreground"
                                    )}
                                >
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
            </div>
        </div>
    );
}
