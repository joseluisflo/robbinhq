import {
  Card,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

const channels = [
  {
    name: 'Chat',
    description: 'Deploy as a chat widget',
    icon: MessageCircle,
    href: '#',
  },
  {
    name: 'Email',
    description: 'Connect to an email address',
    icon: Mail,
    href: '#',
  },
  {
    name: 'Phone',
    description: 'Integrate with a phone number',
    icon: Phone,
    href: '#',
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
             <div className="p-4 border-b">
                <Link href={channel.href} className="group">
                  <p className="font-semibold group-hover:underline">
                    {channel.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {channel.description}
                  </p>
                </Link>
              </div>
            <CardFooter className="p-4">
               <Button variant="outline" className="w-full">Setup</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}