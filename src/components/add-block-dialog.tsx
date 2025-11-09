"use client"

import * as React from "react"
import {
  Box,
  Database,
  GitFork,
  Wrench,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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

const data = {
  nav: [
    { name: "Core", icon: Box },
    { name: "Tools", icon: Wrench },
    { name: "Logic", icon: GitFork },
    { name: "Data", icon: Database },
  ],
}

export function AddBlockDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState("Core");

  const renderContent = () => {
    switch (activeItem) {
      case "Core":
        return Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-video max-w-3xl rounded-xl bg-blue-500/10" />
        ));
      case "Tools":
        return Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-video max-w-3xl rounded-xl bg-green-500/10" />
        ));
      case "Logic":
        return Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-video max-w-3xl rounded-xl bg-yellow-500/10" />
        ));
      case "Data":
        return Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="aspect-video max-w-3xl rounded-xl bg-purple-500/10" />
        ));
      default:
        return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Add a new block</DialogTitle>
        <DialogDescription className="sr-only">
          Select a block to add to your workflow.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          as="a"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveItem(item.name);
                          }}
                          isActive={item.name === activeItem}
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
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Blocks</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeItem}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {renderContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}