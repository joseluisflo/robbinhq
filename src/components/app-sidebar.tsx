'use client';

import * as React from 'react';
import {
  Bot,
  DraftingCompass,
  Globe,
  LayoutDashboard,
  Settings2,
  SlidersHorizontal,
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
  SidebarGroupLabel,
} from '@/components/ui/sidebar';

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

  const navMain = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      title: 'Agents',
      url: '/agents',
      icon: Bot,
      isActive: pathname.startsWith('/agents'),
    },
    {
      title: 'Training',
      url: '/training',
      icon: SlidersHorizontal,
      isActive: pathname.startsWith('/training'),
    },
    {
      title: 'Design',
      url: '/design',
      icon: DraftingCompass,
      isActive: pathname.startsWith('/design'),
    },
    {
      title: 'Domains',
      url: '/domain',
      icon: Globe,
      isActive: pathname.startsWith('/domain'),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AgentSwitcher agents={data.agents} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navMain.map((item) => (
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
