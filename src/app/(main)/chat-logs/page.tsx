
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Loader2, Globe, Monitor, Smartphone } from 'lucide-react';
import { useActiveAgent } from '../layout';
import { useUser, useFirestore, useCollection, query, collection, orderBy } from '@/firebase';
import type { ChatMessage, ChatSession } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


const DetailRow = ({ label, value }: { label: string; value: string | number | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground">{label}:</p>
            <p className="font-medium text-right">{value}</p>
        </div>
    );
};

function ConversationList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { activeAgent } = useActiveAgent();
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  const sessionsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(
        collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'sessions'),
        orderBy('lastActivity', 'desc')
    );
  }, [user, firestore, activeAgent?.id]);
  
  const { data: sessions, loading: sessionsLoading } = useCollection<ChatSession>(sessionsQuery);

  const messagesQuery = useMemo(() => {
    if (!user || !activeAgent?.id || !selectedSession?.id) return null;
    return query(
        collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'sessions', selectedSession.id, 'messages'),
        orderBy('timestamp', 'asc')
    );
  }, [user, firestore, activeAgent?.id, selectedSession?.id]);

  const { data: messages, loading: messagesLoading } = useCollection<ChatMessage>(messagesQuery);
  
  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSession) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  const visitorInfo = selectedSession?.visitorInfo;
  const DeviceIcon = visitorInfo?.device?.type === 'mobile' ? Smartphone : Monitor;


  return (
    <div className="grid h-full w-full grid-cols-[350px_1fr] overflow-hidden">
      {/* Left Panel: Conversation List */}
      <div className="flex flex-col border-r bg-card text-card-foreground overflow-hidden">
  {/* Header fijo */}
  <div className="flex-shrink-0 p-4 space-y-4 border-b">
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
  
  {/* Lista con scroll */}
  <div className="flex-1 overflow-y-auto">
    {sessionsLoading ? (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
          ) : sessions && sessions.length > 0 ? (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={cn(
                  'block w-full text-left p-4 border-b hover:bg-accent',
                  selectedSession?.id === session.id && 'bg-accent'
                )}
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold truncate pr-4">{session.title}</p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {session.lastActivity ? formatDistanceToNow( (session.lastActivity as Timestamp).toDate(), { addSuffix: true }) : 'N/A'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {session.lastMessageSnippet}
                </p>
              </button>
            ))
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <p>No chat sessions found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Conversation View */}
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {selectedSession ? (
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            {/* TabsList fijo - NO está dentro de TabsContent */}
            <div className="flex-shrink-0 px-4 py-2 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
            </div>

            {/* TabsContent con scroll */}
            <TabsContent value="chat" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden min-h-0">
              <div className="p-6 space-y-6">
                {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-end gap-3',
                        msg.sender === 'user' && 'flex-row-reverse'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-lg p-3 text-sm',
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p>{msg.text}</p>
                        <p
                          className={cn(
                            'text-xs mt-2',
                            msg.sender === 'user'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          )}
                        >
                          {msg.timestamp ? format((msg.timestamp as Timestamp).toDate(), 'p') : ''}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        <p>No messages in this session.</p>
                    </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details" className="flex-1 overflow-y-auto mt-0 data-[state=inactive]:hidden min-h-0">
              <div className="p-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      GENERAL DETAILS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DetailRow label="Session ID" value={selectedSession.id || 'N/A'} />
                    <DetailRow label="Source" value={'Widget'} />
                    <DetailRow label="Status" value={'Ongoing'} />
                    <DetailRow label="Messages" value={messages?.length || 0} />
                    <DetailRow label="Created" value={selectedSession.createdAt ? format((selectedSession.createdAt as Timestamp).toDate(), 'MMM d, yyyy, p') : 'N/A'} />
                    <DetailRow label="Last activity" value={selectedSession.lastActivity ? formatDistanceToNow((selectedSession.lastActivity as Timestamp).toDate(), { addSuffix: true }) : 'N/A'} />
                  </CardContent>
                </Card>
                 {visitorInfo && (
                  <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                VISITOR LOCATION
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailRow label="IP Address" value={visitorInfo.ip} />
                            <DetailRow label="City" value={visitorInfo.location?.city} />
                            <DetailRow label="Country" value={visitorInfo.location?.country} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                                VISITOR DEVICE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailRow label="Browser" value={`${visitorInfo.browser?.name || ''} ${visitorInfo.browser?.version || ''}`} />
                            <DetailRow label="Operating System" value={`${visitorInfo.os?.name || ''} ${visitorInfo.os?.version || ''}`} />
                             <DetailRow label="Device Type" value={visitorInfo.device?.type || 'Desktop'} />
                        </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Select a conversation to view</p>
          </div>
        )}
      </div>
    </div>
  );
}


export default function ChatLogsPage() {
    return (
        <div className="flex h-full flex-1">
            <ConversationList />
        </div>
    );
}

