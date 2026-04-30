
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import { ChangePlanDialog } from "./change-plan-dialog";
import { useActiveAgent } from "@/app/(main)/layout";
import { Skeleton } from "../ui/skeleton";
import { useKnowledgeUsage } from "@/hooks/use-knowledge-usage";
import { useAgentFiles, useAgentTexts, useCreditTransactions } from "@/hooks/use-agent-domain";
import { format } from "date-fns";
import { cn } from "@/lib/utils";


const PLAN_DETAILS = {
  free: { 
    name: "Free Plan", 
    price: "$0 per month", 
    credits: 0, 
    agents: 1, 
    knowledgeKB: 400 
  },
  essential: { 
    name: "Essential Plan", 
    price: "$15 per month", 
    credits: 0, 
    agents: 3, 
    knowledgeKB: 40 * 1024 // 40MB
  },
  pro: { 
    name: "Pro Plan", 
    price: "$29 per month", 
    credits: Infinity, 
    agents: Infinity,
    knowledgeKB: 40 * 1024 // 40MB
  },
};

function UsageMeter({ title, used, total, unit = '', current }: { title: string, used: number, total: number, unit?: string, current: number }) {
    const percentage = total > 0 && total !== Infinity ? (used / total) * 100 : 0;
    const isInfinite = total === Infinity;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <p className="font-medium">{title}</p>
                <p className="text-sm font-semibold">
                    {current.toLocaleString()}{unit}
                </p>
            </div>
            {!isInfinite && <Progress value={percentage} />}
             <p className="text-sm text-muted-foreground">
                {isInfinite ? 'Unlimited' : `Used ${used.toLocaleString()}${unit} of ${total.toLocaleString()}${unit}`}
            </p>
        </div>
    );
}

export function BillingSettings() {
    const { userProfile, agents, agentsLoading } = useActiveAgent();
    
    // --- Data fetching for usage meters ---
    const activeAgent = agents?.[0]; // Assume usage is for the primary/first agent for simplicity
    const { texts: textSources, loading: textsLoading } = useAgentTexts(activeAgent?.id);
    const { files: fileSources, loading: filesLoading } = useAgentFiles(activeAgent?.id);
    
    const { currentUsageKB } = useKnowledgeUsage(textSources, fileSources, userProfile);
    const { transactions, loading: transactionsLoading } = useCreditTransactions();

    const loading = agentsLoading || textsLoading || filesLoading || transactionsLoading;
    const planId = userProfile?.planId || 'free';
    const planDetails = PLAN_DETAILS[planId];
    
    const planCredits = planDetails?.credits ?? 0;
    const currentCredits = userProfile?.credits ?? 0;
    const totalCredits = Math.max(planCredits, currentCredits);
    const usedCredits = Math.max(0, totalCredits - currentCredits);

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
                    <div className="flex justify-end items-start">
                        <ChangePlanDialog>
                           <Button variant="outline">Buy Credits</Button>
                        </ChangePlanDialog>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                     {loading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                     ) : (
                        <>
                            <UsageMeter title="Credits" used={usedCredits} total={totalCredits} current={currentCredits} />
                            <UsageMeter title="Agents" used={agents?.length || 0} total={planDetails.agents} current={agents?.length || 0}/>
                            <UsageMeter title="Knowledge Storage" used={Math.round(currentUsageKB)} total={planDetails.knowledgeKB} unit="KB" current={Math.round(currentUsageKB)} />
                        </>
                     )}
                </CardContent>
            </Card>

            <div>
                <h3 className="text-xl font-semibold">Billing History</h3>
                 <p className="text-sm text-muted-foreground">
                    View and download your past invoices.
                </p>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="w-[120px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactionsLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : !transactions || transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="font-medium">
                                        {tx.timestamp ? format(new Date(tx.timestamp), 'MMM d, yyyy') : 'N/A'}
                                    </TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell className={cn("text-right font-semibold", 
                                        tx.type === 'purchase' ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        {tx.type === 'purchase' ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {tx.type === 'purchase' && (
                                            <Button variant="outline" size="sm">
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
