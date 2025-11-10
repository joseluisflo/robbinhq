'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Info } from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: 'Emily Johnson',
    title: 'Meeting Tomorrow',
    snippet: 'Hi team, just a reminder about our meeting tomorrow at 10 AM...',
    time: '09:34 AM',
    avatarId: 'avatar-1',
    messages: [
      {
        sender: 'Emily Johnson',
        text: 'Hi team, just a reminder about our meeting tomorrow at 10 AM. Please come prepared with your updates.',
        time: '09:34 AM',
      },
      {
        sender: 'You',
        text: 'Thanks for the reminder, Emily. I\'ll be there!',
        time: '09:35 AM',
      },
    ],
    details: {
      source: 'Widget or Iframe',
      status: 'Ongoing',
      sentiment: 'Not analyzed',
      messages: 2,
      country: 'United States',
      created: 'Nov 8, 2025, 11:52 PM',
      lastActivity: '1 day ago',
    },
  },
  {
    id: 2,
    name: 'Project Alpha Team',
    title: 'Re: Project Update',
    snippet: 'Thanks for the update. The progress looks great so far....',
    time: 'Yesterday',
    avatarId: 'avatar-1',
    messages: [
      {
        sender: 'You',
        text: 'Here\'s the latest update on Project Alpha. We are on track to meet the deadline.',
        time: 'Yesterday 3:45 PM',
      },
      {
        sender: 'Michael Chen',
        text: 'Thanks for the update. The progress looks great so far. Keep up the good work!',
        time: 'Yesterday 4:02 PM',
      },
    ],
    details: {
      source: 'Email',
      status: 'Completed',
      sentiment: 'Positive',
      messages: 2,
      country: 'Canada',
      created: 'Nov 7, 2025, 03:45 PM',
      lastActivity: 'Yesterday',
    },
  },
  {
    id: 3,
    name: 'Social Committee',
    title: 'Weekend Plans',
    snippet: 'Hey everyone! I\'m thinking of organizing a team outing this weekend....',
    time: '2 days ago',
    avatarId: 'avatar-1',
    messages: [],
    details: {
      source: 'Internal Chat',
      status: 'New',
      sentiment: 'Neutral',
      messages: 0,
      country: 'United Kingdom',
      created: 'Nov 6, 2025, 10:00 AM',
      lastActivity: '2 days ago',
    },
  },
];

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center text-sm">
    <p className="text-muted-foreground">{label}:</p>
    <p className="font-medium text-right">{value}</p>
  </div>
);

export default function ChatLogsPage() {
  const [selectedConversation, setSelectedConversation] = useState(
    conversations[0]
  );
  const avatarImage = PlaceHolderImages.find((img) => img.id === 'avatar-1');

  return (
    <div className="flex h-full flex-1">
      <div className="grid h-full w-full grid-cols-[350px_1fr] overflow-hidden">
        {/* Left Panel: Conversation List */}
        <div className="flex flex-col border-r bg-card text-card-foreground">
          <div className="p-4 space-y-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Chat logs</h2>
              <div className="flex items-center gap-2">
                <Label htmlFor="unreads" className="text-sm">
                  Unreads
                </Label>
                <Switch id="unreads" />
              </div>
            </div>
            <Input placeholder="Type to search..." />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={cn(
                  'block w-full text-left p-4 border-b hover:bg-accent',
                  selectedConversation.id === conv.id && 'bg-accent'
                )}
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold">{conv.title}</p>
                  <p className="text-xs text-muted-foreground">{conv.time}</p>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conv.snippet}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Conversation View */}
        <div className="flex flex-col h-full bg-background">
          {selectedConversation ? (
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <div className="px-4 py-2 border-b">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {selectedConversation.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-end gap-3',
                        msg.sender === 'You' && 'flex-row-reverse'
                      )}
                    >
                      {msg.sender !== 'You' && (
                        <Avatar className="h-8 w-8">
                          {avatarImage && (
                            <AvatarImage
                              src={avatarImage.imageUrl}
                              alt={msg.sender}
                              data-ai-hint={avatarImage.imageHint}
                            />
                          )}
                          <AvatarFallback>
                            {msg.sender.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          'max-w-[70%] rounded-lg p-3 text-sm',
                          msg.sender === 'You'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p>{msg.text}</p>
                        <p
                          className={cn(
                            'text-xs mt-2',
                            msg.sender === 'You'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          )}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="flex-1 overflow-y-auto p-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      GENERAL DETAILS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DetailRow label="Source" value={selectedConversation.details.source} />
                    <DetailRow label="Status" value={selectedConversation.details.status} />
                    <DetailRow label="Sentiment" value={selectedConversation.details.sentiment} />
                    <DetailRow label="Messages" value={selectedConversation.details.messages} />
                    <DetailRow label="Country" value={selectedConversation.details.country} />
                    <DetailRow label="Created" value={selectedConversation.details.created} />
                    <DetailRow label="Last activity" value={selectedConversation.details.lastActivity} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Select a conversation to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
