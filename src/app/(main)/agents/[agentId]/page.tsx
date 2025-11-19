'use client';

import { useState, useTransition, use } from 'react';
import { mockAgents } from '@/lib/data';
import type { Agent, Task } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wand2 } from 'lucide-react';
import { getTasksSummary } from '../../../actions/agents';
import { useToast } from '@/hooks/use-toast';
import { notFound, useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

export default function AgentDetailPage() {
  const params = useParams() as { agentId: string };
  const [agent, setAgent] = useState<Agent | undefined>(
    mockAgents.find((a) => a.id === params.agentId)
  );

  const [newTask, setNewTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useTransition();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const { toast } = useToast();

  if (!agent) {
    notFound();
  }

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask) return;

    setIsSubmitting(() => {
      const createdTask: Task = {
        id: `task-${agent.id}-${agent.tasks.length + 1}`,
        name: newTask,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setAgent({ ...agent, tasks: [createdTask, ...agent.tasks] });
      setNewTask('');
      toast({ title: 'Task Assigned', description: `"${newTask}" has been assigned.` });
    });
  };

  const handleSummarize = async () => {
    const completedTasks = agent.tasks.filter(t => t.status === 'completed' && t.result);
    if (completedTasks.length === 0) {
      toast({ title: 'No results to summarize', variant: 'destructive' });
      return;
    }
    
    const resultsToSummarize = completedTasks.map(t => `Task: ${t.name}\nResult: ${t.result}`).join('\n\n');
    
    setIsSummarizing(true);
    setSummary('');
    const result = await getTasksSummary(resultsToSummarize);
    if (typeof result === 'string') {
      setSummary(result);
    } else {
      toast({ title: 'Error summarizing results', description: result.error, variant: 'destructive' });
    }
    setIsSummarizing(false);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{agent.name}</CardTitle>
          <CardDescription>{agent.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Goals</h3>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            {agent.goals.map((goal, i) => (
              <li key={i}>{goal}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assign a New Task</CardTitle>
        </CardHeader>
        <form onSubmit={handleAssignTask}>
          <CardContent>
            <Input
              placeholder="e.g., Find the top 3 AI startups in Europe"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !newTask}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Task
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task History</CardTitle>
              <CardDescription>All tasks assigned to this agent.</CardDescription>
            </div>
            <Button variant="outline" onClick={handleSummarize} disabled={isSummarizing}>
              {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Summarize Results
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {summary && (
            <div className="mb-6 p-4 bg-accent/50 border border-accent rounded-lg">
              <h4 className="font-semibold mb-2 text-accent-foreground">AI Summary of Completed Tasks</h4>
              <p className="text-sm text-accent-foreground/80 whitespace-pre-wrap">{summary}</p>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agent.tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.name}</TableCell>
                  <TableCell>
                    <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {task.result || 'No result yet.'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
