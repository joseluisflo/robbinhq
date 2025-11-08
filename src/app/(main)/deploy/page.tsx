import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RocketIcon } from '@/components/lo-icons/RocketIcon'

export default function DeployPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Deploy</h2>
      <Card>
        <CardHeader>
          <CardTitle>Deploy Your Agent</CardTitle>
          <CardDescription>
            When you're ready, you can deploy your agent to make it available
            online.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <RocketIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Ready to Launch?</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Deploy your agent to a shareable URL with just one click.
            </p>
            <Button>Deploy Agent</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
