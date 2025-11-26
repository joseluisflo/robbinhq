

"use client"

import * as React from "react"
import {
  Bell,
  Bot,
  CreditCard,
  Globe,
  Lock,
  Paintbrush,
  Settings,
  BadgeCheck,
  MessageSquare,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AccountSettings } from "./settings/account-settings"
import { AgentSettings } from "./settings/agent-settings"
import { LogSettings } from "./settings/log-settings"
import { BillingSettings } from "./settings/billing-settings"

const navItems = [
    { name: "Account", icon: BadgeCheck },
    { name: "Agent", icon: Bot },
    { name: "Logs", icon: MessageSquare },
    { name: "Billing", icon: CreditCard },
    { name: "Language & region", icon: Globe },
    { name: "Privacy & visibility", icon: Lock },
    { name: "Advanced", icon: Settings },
];

export function SettingsDialog({ children, initialTab = "Account" }: { children: React.ReactNode, initialTab?: string }) {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState(initialTab);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    // Reset to the initialTab when dialog is opened via a specific trigger
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          onClick={() => setActiveTab(item.name)}
                          isActive={activeTab === item.name}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink asChild>
                        <button onClick={() => setActiveTab("Account")}>Settings</button>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              
              {activeTab === 'Account' && <AccountSettings />}
              {activeTab === 'Agent' && <AgentSettings />}
              {activeTab === 'Logs' && <LogSettings />}
              {activeTab === 'Billing' && <BillingSettings />}


              {activeTab !== 'Account' && activeTab !== 'Agent' && activeTab !== 'Logs' && activeTab !== 'Billing' && (
                 <>
                    {/* Placeholder Content */}
                    <div className="text-center p-8">
                        <h2 className="text-xl font-semibold">{activeTab}</h2>
                        <p className="text-muted-foreground mt-2">
                        Content for {activeTab} will be here.
                        </p>
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                        key={i}
                        className="bg-muted/50 h-32 w-full max-w-3xl rounded-xl"
                        />
                    ))}
                 </>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
