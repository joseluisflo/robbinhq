
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, Loader2, Globe, Monitor, Smartphone, Mail, MessageSquare } from 'lucide-react';
import { useActiveAgent } from '../layout';
import { useUser, useFirestore, useCollection, query, collection, orderBy } from '@/firebase';
import type { ChatMessage, ChatSession, EmailSession, EmailMessage } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';


type CombinedSession = (ChatSession | EmailSession) & { type: 'chat' | 'email' };
type CombinedMessage = ChatMessage | EmailMessage;

const DetailRow = ({ label, value }: { label: string; value: string | number | undefined | null }) => {
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
  const [selectedSession, setSelectedSession] = useState<CombinedSession | null>(null);

  // Query for chat sessions
  const sessionsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(
        collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'sessions'),
        orderBy('lastActivity', 'desc')
    );
  }, [user, firestore, activeAgent?.id]);
  const { data: chatSessions, loading: chatSessionsLoading } = useCollection<ChatSession>(sessionsQuery);

  // Query for email sessions
  const emailSessionsQuery = useMemo(() => {
    if (!user || !activeAgent?.id) return null;
    return query(
      collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'emailSessions'),
      orderBy('lastActivity', 'desc')
    );
  }, [user, firestore, activeAgent?.id]);
  const { data: emailSessions, loading: emailSessionsLoading } = useCollection<EmailSession>(emailSessionsQuery);
  
  // Combine and sort sessions
  const combinedSessions = useMemo(() => {
    const chatsWithType: CombinedSession[] = (chatSessions || []).map(s => ({ ...s, type: 'chat' }));
    const emailsWithType: CombinedSession[] = (emailSessions || []).map(s => ({ ...s, type: 'email' }));
    
    const allSessions = [...chatsWithType, ...emailsWithType];
    
    allSessions.sort((a, b) => {
      const timeA = (a.lastActivity as Timestamp)?.toDate() || 0;
      const timeB = (b.lastActivity as Timestamp)?.toDate() || 0;
      return (timeB as any) - (timeA as any);
    });
    
    return allSessions;
  }, [chatSessions, emailSessions]);

  const messagesQuery = useMemo(() => {
    if (!user || !activeAgent?.id || !selectedSession?.id) return null;
    const sessionTypePath = selectedSession.type === 'chat' ? 'sessions' : 'emailSessions';
    return query(
        collection(firestore, 'users', user.uid, 'agents', activeAgent.id, sessionTypePath, selectedSession.id, 'messages'),
        orderBy('timestamp', 'asc')
    );
  }, [user, firestore, activeAgent?.id, selectedSession]);

  const { data: messages, loading: messagesLoading } = useCollection<CombinedMessage>(messagesQuery);
  
  useEffect(() => {
    if (combinedSessions.length > 0 && !selectedSession) {
      setSelectedSession(combinedSessions[0]);
    }
  }, [combinedSessions, selectedSession]);
  
  const visitorInfo = (selectedSession as ChatSession)?.visitorInfo;
  const DeviceIcon = visitorInfo?.device?.type === 'mobile' ? Smartphone : Monitor;

  return (
    <div className="grid h-full w-full grid-cols-[350px_1fr] overflow-hidden">
      {/* Left Panel: Conversation List */}
      <div className="flex flex-col border-r bg-card text-card-foreground overflow-hidden">
        <div className="flex-shrink-0 p-4 space-y-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Logs</h2>
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
          {(chatSessionsLoading || emailSessionsLoading) ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : combinedSessions.length > 0 ? (
            combinedSessions.map((session) => (
              <button
                key={`${session.type}-${session.id}`}
                onClick={() => setSelectedSession(session)}
                className={cn(
                  'block w-full text-left p-4 border-b hover:bg-accent',
                  selectedSession?.id === session.id && 'bg-accent'
                )}
              >
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-2 overflow-hidden">
                        {session.type === 'chat' ? <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" /> : <Mail className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <p className="font-semibold truncate pr-4">{(session as ChatSession).title || (session as EmailSession).subject}</p>
                   </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {session.lastActivity ? formatDistanceToNow((session.lastActivity as Timestamp).toDate(), { addSuffix: true }) : 'N/A'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground truncate pl-6">
                  {(session as ChatSession).lastMessageSnippet || '...'}
                </p>
              </button>
            ))
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <p>No conversation logs found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Conversation View */}
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {selectedSession ? (
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <div className="flex-shrink-0 px-4 py-2 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat">Conversation</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
            </div>

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
                        msg.sender === 'user' || (typeof msg.sender === 'string' && msg.sender.includes('@')) ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[70%] rounded-lg p-3 text-sm',
                          msg.sender === 'user' || (typeof msg.sender === 'string' && msg.sender.includes('@'))
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <p>{msg.text}</p>
                        <p
                          className={cn(
                            'text-xs mt-2',
                             msg.sender === 'user' || (typeof msg.sender === 'string' && msg.sender.includes('@'))
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
                    <DetailRow label="Source" value={selectedSession.type === 'chat' ? 'Widget' : 'Email'} />
                    <DetailRow label="Status" value={'Ongoing'} />
                    <DetailRow label="Messages" value={messages?.length || 0} />
                    <DetailRow label="Created" value={selectedSession.createdAt ? format((selectedSession.createdAt as Timestamp).toDate(), 'MMM d, yyyy, p') : 'N/A'} />
                    <DetailRow label="Last activity" value={selectedSession.lastActivity ? formatDistanceToNow((selectedSession.lastActivity as Timestamp).toDate(), { addSuffix: true }) : 'N/A'} />
                    {selectedSession.type === 'email' && (
                        <DetailRow label="Participants" value={(selectedSession as EmailSession).participants?.join(', ')} />
                    )}
                  </CardContent>
                </Card>
                 {selectedSession.type === 'chat' && visitorInfo && (
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
