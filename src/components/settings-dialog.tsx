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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { Label } from "./ui/label"
import { Input } from "./ui/input"

const navItems = [
    { name: "Account", icon: BadgeCheck },
    { name: "Agent", icon: Bot },
    { name: "Appearance", icon: Paintbrush },
    { name: "Notifications", icon: Bell },
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
              
              {activeTab === 'Account' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Name</CardTitle>
                      <CardDescription>This is how your name will be displayed in the app.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Input defaultValue="John Doe" />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                      <Button>Save</Button>
                    </CardFooter>
                  </Card>
                   <Card>
                    <CardHeader>
                      <CardTitle>Email Address</CardTitle>
                      <CardDescription>Your email address is used for login and notifications.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Input defaultValue="john.doe@example.com" readOnly />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 text-sm text-muted-foreground">
                      Your email cannot be changed.
                    </CardFooter>
                  </Card>
                   <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>Manage your password for added security.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline">Change password</Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab !== 'Account' && (
                 <>
                    {/* Placeholder Content */}
                    <div className="text-center p-8">
                        <h2 className="text-xl font-semibold">{activeTab} Settings</h2>
                        <p className="text-muted-foreground mt-2">
                        Content for {activeTab} will go here.
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
