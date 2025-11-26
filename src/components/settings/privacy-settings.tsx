"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download } from "lucide-react";

export function PrivacySettings() {
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
                        <Select defaultValue="90">
                            <SelectTrigger id="data-retention" className="w-full md:w-1/2">
                                <SelectValue placeholder="Select retention period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30">30 days</SelectItem>
                                <SelectItem value="90">90 days</SelectItem>
                                <SelectItem value="365">1 year</SelectItem>
                                <SelectItem value="forever">Forever</SelectItem>
                            </SelectContent>
                        </Select>
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