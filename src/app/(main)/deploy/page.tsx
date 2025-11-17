import {
  Card,
  CardFooter,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Mail, Phone, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

const channels = [
  {
    name: 'Chat',
    description: 'Deploy as a chat widget',
    icon: MessageCircle,
    href: '/deploy/chat',
  },
  {
    name: 'Email',
    description: 'Connect to an email address',
    icon: Mail,
    href: '/deploy/email',
  },
  {
    name: 'Phone',
    description: 'Integrate with a phone number',
    icon: Phone,
    href: '/deploy/phone',
  },
]

export default function DeployPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {channels.map((channel) => (
          <Card key={channel.name}>
            <Link href={channel.href} className="block hover:opacity-90 transition-opacity">
              <div className="h-32 bg-gradient-to-br from-gray-400 to-gray-600 rounded-t-lg flex items-center justify-center">
                <channel.icon className="h-12 w-12 text-white/80" />
              </div>
            </Link>
             <CardContent className="p-4 border-b">
                <Link href={channel.href} className="group">
                  <p className="font-semibold group-hover:underline">
                    {channel.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {channel.description}
                  </p>
                </Link>
              </CardContent>
            <CardFooter className="p-4 flex items-center justify-between gap-2">
               <Button variant="outline" asChild className="flex-1">
                 <Link href={channel.href}>Setup</Link>
               </Button>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Configure</DropdownMenuItem>
                </DropdownMenuContent>
               </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
