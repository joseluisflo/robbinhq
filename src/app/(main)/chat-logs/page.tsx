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
  },
  {
    id: 3,
    name: 'Social Committee',
    title: 'Weekend Plans',
    snippet: 'Hey everyone! I\'m thinking of organizing a team outing this weekend....',
    time: '2 days ago',
    avatarId: 'avatar-1',
    messages: [],
  },
];

export default function ChatLogsPage() {
  const [selectedConversation, setSelectedConversation] = useState(
    conversations[0]
  );
  const avatarImage = PlaceHolderImages.find((img) => img.id === 'avatar-1');

  return (
    <div className="flex h-full flex-1">
      <div className="grid h-full w-full grid-cols-[350px_1fr] border bg-card text-card-foreground shadow-sm rounded-lg overflow-hidden">
        {/* Left Panel: Conversation List */}
        <div className="flex flex-col border-r">
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
            <>
              <div className="p-4 border-b flex items-center gap-3">
                {avatarImage && (
                    <Avatar>
                        <AvatarImage src={avatarImage.imageUrl} alt={selectedConversation.name} data-ai-hint={avatarImage.imageHint}/>
                        <AvatarFallback>
                        {selectedConversation.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Online
                  </p>
                </div>
              </div>
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
                            {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={msg.sender} data-ai-hint={avatarImage.imageHint} />}
                            <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
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
                       <p className={cn("text-xs mt-2", msg.sender === 'You' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Textarea placeholder="Type your message..." />
                <div className="flex justify-end mt-2">
                    <Button>Send</Button>
                </div>
              </div>
            </>
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
