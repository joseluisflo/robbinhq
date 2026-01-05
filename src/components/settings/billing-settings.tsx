
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";
import { ChangePlanDialog } from "./change-plan-dialog";
import { useActiveAgent } from "@/app/(main)/layout";
import { Skeleton } from "../ui/skeleton";
import type { Timestamp } from "firebase/firestore";
import { useKnowledgeUsage } from "@/hooks/use-knowledge-usage";
import { useUser, useFirestore, useCollection, query, collection, orderBy } from '@/firebase';
import type { TextSource, AgentFile, ChatSession, EmailSession, Lead, CreditTransaction } from '@/lib/types';
import { useMemo } from 'react';
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
    const { user } = useUser();
    const firestore = useFirestore();
    const { userProfile, agents, agentsLoading } = useActiveAgent();
    
    // --- Data fetching for usage meters ---
    const activeAgent = agents?.[0]; // Assume usage is for the primary/first agent for simplicity
    const textsQuery = useMemo(() => user && activeAgent?.id ? query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'texts')) : null, [user, firestore, activeAgent?.id]);
    const { data: textSources, loading: textsLoading } = useCollection<TextSource>(textsQuery);

    const filesQuery = useMemo(() => user && activeAgent?.id ? query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'files')) : null, [user, firestore, activeAgent?.id]);
    const { data: fileSources, loading: filesLoading } = useCollection<AgentFile>(filesQuery);
    
    const { currentUsageKB, usageLimitKB } = useKnowledgeUsage(textSources, fileSources, userProfile);
    
    const chatSessionsQuery = useMemo(() => user && activeAgent?.id ? query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'sessions')) : null, [user, firestore, activeAgent?.id]);
    const { data: chatSessions, loading: chatLoading } = useCollection<ChatSession>(chatSessionsQuery);
    const emailSessionsQuery = useMemo(() => user && activeAgent?.id ? query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'emailSessions')) : null, [user, firestore, activeAgent?.id]);
    const { data: emailSessions, loading: emailLoading } = useCollection<EmailSession>(emailSessionsQuery);
    const leadsQuery = useMemo(() => user && activeAgent?.id ? query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'leads')) : null, [user, firestore, activeAgent?.id]);
    const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

    const transactionsQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'creditTransactions'),
            orderBy('timestamp', 'desc')
        );
    }, [user, firestore]);
    const { data: transactions, loading: transactionsLoading } = useCollection<CreditTransaction>(transactionsQuery);

    const loading = agentsLoading || textsLoading || filesLoading || chatLoading || emailLoading || leadsLoading || transactionsLoading;
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
                    <div className="flex justify-between items-start">
                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ) : (
                             <div>
                                 <p className="text-sm font-semibold text-primary uppercase">{planId}</p>
                                 <h4 className="text-xl font-bold">{planDetails.name}</h4>
                                 <p className="text-muted-foreground mt-1">{planDetails.price}</p>
                             </div>
                        )}
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
                                        {tx.timestamp ? format((tx.timestamp as Timestamp).toDate(), 'MMM d, yyyy') : 'N/A'}
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
