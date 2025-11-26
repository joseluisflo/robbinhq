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
                         <div className="w-full">
                            <RadioGroup
                                value={retention}
                                onValueChange={setRetention}
                                className="grid grid-cols-4 gap-2 rounded-lg bg-muted p-1"
                            >
                                {retentionOptions.map((option) => (
                                    <div key={option.value}>
                                        <RadioGroupItem value={option.value} id={`retention-${option.value}`} className="sr-only" />
                                        <Label 
                                            htmlFor={`retention-${option.value}`}
                                            className={cn(
                                                "flex justify-center items-center rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors",
                                                retention === option.value 
                                                    ? "bg-background text-foreground shadow-sm" 
                                                    : "hover:bg-muted/50 text-muted-foreground"
                                            )}
                                        >
                                            {option.label}
                                        </Label>
                                    </div>
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
