
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

function UsageMeter({ title, used, total }: { title: string, used: number, total: number }) {
    const remaining = total - used;
    const percentage = (used / total) * 100;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{used.toLocaleString()} of {total.toLocaleString()}</p>
            </div>
            <Progress value={percentage} />
            <p className="text-sm text-muted-foreground">{remaining.toLocaleString()} remaining</p>
        </div>
    );
}


export function BillingSettings() {
    return (
        <div className="space-y-8">
             <div>
                <h3 className="text-2xl font-semibold">Billing</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your subscription and view usage details.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <p className="text-sm font-semibold text-primary">FREE</p>
                             <h4 className="text-xl font-bold">Starter Plan</h4>
                             <p className="text-muted-foreground mt-1">$0 per month</p>
                        </div>
                        <Button variant="outline">Change Plan</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                     <UsageMeter title="IA Interactions" used={150} total={2000} />
                     <UsageMeter title="Agents" used={1} total={3} />
                     <UsageMeter title="Knowledge Storage" used={50} total={250} />
                </CardContent>
            </Card>
        </div>
    );
}
