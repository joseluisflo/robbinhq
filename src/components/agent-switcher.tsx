"use client"

import * as React from "react"
import Link from "next/link"
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

export function AgentSwitcher({
  agents,
}: {
  agents: {
    name: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const [activeAgent, setActiveAgent] = React.useState(agents[0])

  if (!activeAgent) {
    return null
  }

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
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
              <ChevronsUpDown className="ml-auto" />
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
                key={agent.name}
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
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/agents/create">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Create Agent</div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
