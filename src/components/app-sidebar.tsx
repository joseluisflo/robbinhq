
'use client';

import * as React from 'react';
import {
  Users,
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
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { DashboardIcon, AiChemistryIcon, PenToolIcon, MotionIcon, RocketIcon, ChatSimpleIcon, UserGroupIcon } from '@/components/lo-icons';
import { useUser } from '@/firebase';
import { useActiveAgent } from '@/app/(main)/layout';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user } = useUser();
  const { agents, agentsLoading } = useActiveAgent();


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
      icon: MotionIcon,
      isActive: pathname.startsWith('/workflow'),
    },
    {
      title: 'Deploy',
      url: '/deploy',
      icon: RocketIcon,
      isActive: pathname.startsWith('/deploy'),
    },
  ];

  const navActivity = [
    {
      title: 'Chat logs',
      url: '/chat-logs',
      icon: ChatSimpleIcon,
      isActive: pathname.startsWith('/chat-logs'),
    },
    {
      title: 'Leads',
      url: '/leads',
      icon: UserGroupIcon,
      isActive: pathname.startsWith('/leads'),
    },
  ];

  const isDashboardActive = pathname === '/dashboard';

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {agentsLoading ? <SidebarMenuSkeleton showIcon /> : <AgentSwitcher />}
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
                    {item.icon && <item.icon variant={item.isActive ? 'filled' : 'stroke'} />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
