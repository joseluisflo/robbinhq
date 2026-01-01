'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { analyzeSessionsForLeads } from '@/app/actions/leads';
import { exportAgentData } from '@/app/actions/export';
import { Loader2, Sparkles, Download } from 'lucide-react';
import type { Lead } from '@/lib/types';


interface LeadsHeaderProps {
    leads: Lead[] | null;
}

export function LeadsHeader({ leads }: LeadsHeaderProps) {
    const [isAnalyzing, startAnalysis] = useTransition();
    const [isExporting, startExporting] = useTransition();
    const { user } = useUser();
    const { activeAgent } = useActiveAgent();
    const { toast } = useToast();

    const handleAnalyze = () => {
        if (!user || !activeAgent?.id) return;

        startAnalysis(async () => {
            toast({ title: 'Starting analysis...', description: 'Searching for new leads in your chat logs.' });
            const result = await analyzeSessionsForLeads(user.uid, activeAgent.id!);
            if (result.success) {
                toast({ title: 'Analysis Complete!', description: `${result.leadsFound} new lead(s) found.` });
            } else {
                toast({ title: 'Analysis Failed', description: result.error, variant: 'destructive' });
            }
        });
    }

    const handleExport = () => {
        if (!user || !activeAgent?.id) return;

        startExporting(async () => {
            toast({ title: "Exporting data...", description: "This may take a moment." });
            const result = await exportAgentData(user.uid, activeAgent.id!);

            if (result.error) {
                toast({ title: "Export Failed", description: result.error, variant: "destructive" });
            } else {
                const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `agent_${activeAgent.id}_export.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: "Export Successful", description: "Your agent data has been downloaded." });
            }
        });
    };

    return (
        <div className="flex items-center justify-between">
            <div className='grid gap-2'>
                <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
                <p className="text-muted-foreground">View and manage leads captured by your agents.</p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport} disabled={isExporting || !leads || leads.length === 0}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export
                </Button>
                <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze conversations
                </Button>
            </div>
        </div>
    )
}
