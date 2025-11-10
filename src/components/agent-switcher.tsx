"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CreateAgentDialog } from "./create-agent-dialog"
import type { Agent } from "@/lib/types"

export function AgentSwitcher({
  agents,
}: {
  agents: Agent[]
}) {
  const { isMobile } = useSidebar()
  const [activeAgent, setActiveAgent] = React.useState<Agent | null>(null);

  React.useEffect(() => {
    if (agents && agents.length > 0 && !activeAgent) {
      setActiveAgent(agents[0]);
    }
  }, [agents, activeAgent]);

  if (!activeAgent) {
    return null
  }

  const getInitials = (name: string) => {
    if (!name) return 'AG';
    const names = name.split(' ');
    if (names.length > 1) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <AvatarFallback className="bg-transparent text-sm font-bold">
                    {getInitials(activeAgent.name)}
                  </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeAgent.name}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Agents
            </DropdownMenuLabel>
            {agents.map((agent) => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => setActiveAgent(agent)}
                className="gap-2 p-2"
              >
                <Avatar className="flex size-6 items-center justify-center rounded-sm border bg-secondary text-secondary-foreground">
                    <AvatarFallback className="bg-transparent text-xs font-bold">
                      {getInitials(agent.name)}
                    </AvatarFallback>
                </Avatar>
                {agent.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
              <CreateAgentDialog>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Create Agent</div>
                </DropdownMenuItem>
              </CreateAgentDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
