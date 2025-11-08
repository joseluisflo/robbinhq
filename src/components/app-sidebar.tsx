'use client';

import * as React from 'react';
import {
  UploadCloud,
  MessageSquare,
  Users,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AgentSwitcher } from '@/components/agent-switcher';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarRail,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { DashboardIcon, AiChemistryIcon, PenToolIcon } from '@/components/lo-icons';

// This is sample data. We'll simplify it for our app.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  agents: [
    {
      name: 'AgentVerse',
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const navPlatform = [
    {
      title: 'Training',
      url: '/training',
      icon: AiChemistryIcon,
      isActive: pathname.startsWith('/training'),
    },
    {
      title: 'Design',
      url: '/design',
      icon: PenToolIcon,
      isActive: pathname.startsWith('/design'),
    },
    {
      title: 'Workflow',
      url: '/workflow',
      icon: Workflow,
      isActive: pathname.startsWith('/workflow'),
    },
    {
      title: 'Deploy',
      url: '/deploy',
      icon: UploadCloud,
      isActive: pathname.startsWith('/deploy'),
    },
  ];

  const navActivity = [
    {
      title: 'Chat logs',
      url: '/chat-logs',
      icon: MessageSquare,
      isActive: pathname.startsWith('/chat-logs'),
    },
    {
      title: 'Leads',
      url: '/leads',
      icon: Users,
      isActive: pathname.startsWith('/leads'),
    },
  ];

  const isDashboardActive = pathname === '/dashboard';

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AgentSwitcher agents={data.agents} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
           <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/dashboard" passHref>
                  <SidebarMenuButton
                    tooltip="Dashboard"
                    isActive={isDashboardActive}
                  >
                    <DashboardIcon variant={isDashboardActive ? 'filled' : 'stroke'} />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
           </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navPlatform.map((item) => (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} passHref>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.isActive}
                  >
                    {item.icon && <item.icon variant={item.isActive ? 'filled' : 'stroke'} />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Activity</SidebarGroupLabel>
          <SidebarMenu>
            {navActivity.map((item) => (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} passHref>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.isActive}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
