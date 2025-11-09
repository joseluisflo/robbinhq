'use client';

import * as React from 'react';
import {
  MessageSquare,
  FileText,
  GitFork,
  Send,
  Mail,
  FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';

const blocks = [
  { name: 'Ask a question', icon: MessageSquare, category: 'Interaction' },
  { name: 'Send a message', icon: Send, category: 'Interaction' },
  { name: 'Request a file', icon: FileUp, category: 'Interaction' },
  { name: 'Conditional branch', icon: GitFork, category: 'Logic' },
  { name: 'Analyze a file', icon: FileText, category: 'Functions' },
  { name: 'Send an email', icon: Mail, category: 'Functions' },
];

const blockCategories = ['Interaction', 'Logic', 'Functions'];

export function AddBlockDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-hidden p-0 max-w-2xl h-[500px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Add a block</DialogTitle>
          <DialogDescription>
            Select a block to add to your workflow.
          </DialogDescription>
        </DialogHeader>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="h-full">
            <SidebarContent className="p-2">
              {blockCategories.map((category) => (
                <SidebarGroup key={category}>
                  <SidebarMenu>
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1">{category}</p>
                    {blocks
                      .filter((block) => block.category === category)
                      .map((item) => (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton size="sm">
                            <item.icon />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
          <main className="flex h-full flex-1 flex-col overflow-hidden items-center justify-center bg-muted/50">
            <p className="text-sm text-muted-foreground">Select a block to see its details.</p>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
