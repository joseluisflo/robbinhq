'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getGoalSuggestions } from '../actions';
import { Wand2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CreateAgentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const [purposePrompt, setPurposePrompt] = useState('');
  const [goals, setGoals] = useState('');

  const handleSuggestGoals = async () => {
    if (!purposePrompt) {
      toast({
        title: 'Purpose is empty',
        description: 'Please describe the agent\'s purpose first.',
        variant: 'destructive',
      });
      return;
    }
    setIsSuggesting(true);
    const result = await getGoalSuggestions(purposePrompt);
    if ('error' in result) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setGoals(result.join('\n'));
    }
    setIsSuggesting(false);
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(() => {
      // In a real app, you'd save the new agent here.
      toast({
        title: 'Agent Created',
        description: 'Your new agent is ready.',
      });
      router.push('/dashboard/agents');
    });
  };

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Create a New Agent</h2>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>Define the name, purpose, and goals for your new AI agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input id="agent-name" placeholder="e.g., Market Research Bot" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-description">Description</Label>
              <Textarea id="agent-description" placeholder="A brief description of what this agent does." />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="agent-purpose">Agent's Purpose</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleSuggestGoals} disabled={isSuggesting}>
                  {isSuggesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Suggest Goals
                </Button>
              </div>
              <Textarea 
                id="agent-purpose" 
                placeholder="Describe the agent's main purpose to get AI-powered goal suggestions. e.g., 'An agent that scours the web for market trends.'"
                value={purposePrompt}
                onChange={(e) => setPurposePrompt(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-goals">Goals</Label>
              <Textarea
                id="agent-goals"
                placeholder="List the agent's goals, one per line."
                rows={5}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Agent
          </Button>
        </div>
      </form>
    </div>
  );
}
