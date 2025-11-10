import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, Mail, Phone } from 'lucide-react'

const channels = [
  {
    name: 'Chat',
    description: 'Deploy your agent as a chat widget on your website.',
    icon: MessageCircle,
  },
  {
    name: 'Email',
    description: 'Connect your agent to an email address to automate responses.',
    icon: Mail,
  },
  {
    name: 'Phone',
    description: 'Integrate your agent with a phone number for voice interactions.',
    icon: Phone,
  },
]

export default function DeployPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Deploy</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel) => (
          <Card key={channel.name}>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent rounded-lg">
                        <channel.icon className="h-6 w-6 text-accent-foreground" />
                    </div>
                    <CardTitle>{channel.name}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{channel.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Configure
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
