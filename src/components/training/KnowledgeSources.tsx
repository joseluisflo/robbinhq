

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Info, Loader2, PlusCircle, Trash2, FileText, File as FileIcon, AlertCircle } from 'lucide-react';
import { AddTextDialog } from '@/components/add-text-dialog';
import { AddFileDialog } from '@/components/add-file-dialog';
import type { TextSource, AgentFile } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { PdfIcon, TxtIcon, DocxIcon, HtmlIcon, MarkdownIcon } from '@/components/illustrations';


interface KnowledgeSourcesProps {
  sourceType: 'text' | 'file';
  textSources: TextSource[];
  fileSources: AgentFile[];
  textsLoading: boolean;
  filesLoading: boolean;
  handleDeleteText: (id: string) => void;
  handleDeleteFile: (id: string) => void;
  isLimitReached: boolean;
  currentUsageKB: number;
  usageLimitKB: number;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatKilobytes(kb: number) {
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    } else {
        return `${(kb / 1024).toFixed(1)} MB`;
    }
}


function KnowledgeUsageBar({ currentUsageKB, usageLimitKB, isLimitReached }: { currentUsageKB: number; usageLimitKB: number; isLimitReached: boolean }) {
  const usagePercentage = Math.min((currentUsageKB / usageLimitKB) * 100, 100);
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
            <p className="text-sm font-medium">Knowledge Base Usage</p>
            <p className="text-sm text-muted-foreground">{formatKilobytes(currentUsageKB)} / {formatKilobytes(usageLimitKB)}</p>
        </div>
        <Progress value={usagePercentage} />
        {isLimitReached && (
             <Alert variant="destructive" className="mt-2 text-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Storage Limit Reached</AlertTitle>
                <AlertDescription>
                    You have reached your plan's storage limit. Please upgrade your plan or remove existing sources to add more.
                </AlertDescription>
            </Alert>
        )}
      </div>
    </Card>
  );
}

const getFileIcon = (fileType: string, fileName: string): React.ElementType => {
    const lowerFileName = fileName.toLowerCase();
    if (fileType === 'application/pdf' || lowerFileName.endsWith('.pdf')) {
      return PdfIcon;
    }
    if (fileType.includes('word') || lowerFileName.endsWith('.doc') || lowerFileName.endsWith('.docx')) {
      return DocxIcon;
    }
    if (lowerFileName.endsWith('.md')) {
        return MarkdownIcon;
    }
    if (fileType.startsWith('text/html') || lowerFileName.endsWith('.html') || lowerFileName.endsWith('.htm')) {
        return HtmlIcon;
    }
    if (fileType.startsWith('text/')) {
      return TxtIcon;
    }
    return FileIcon; // Fallback icon
};


export function KnowledgeSources({
  sourceType,
  textSources,
  fileSources,
  textsLoading,
  filesLoading,
  handleDeleteText,
  handleDeleteFile,
  isLimitReached,
  currentUsageKB,
  usageLimitKB,
}: KnowledgeSourcesProps) {
  
  const loading = textsLoading || filesLoading;
  
  const renderHeader = () => (
     <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{sourceType === 'text' ? 'Texts' : 'Files'}</h3>
        {sourceType === 'text' ? (
          <AddTextDialog>
            <Button variant="outline" size="sm" disabled={isLimitReached}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add text
            </Button>
          </AddTextDialog>
        ) : (
          <AddFileDialog>
            <Button variant="outline" size="sm" disabled={isLimitReached}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload files
            </Button>
          </AddFileDialog>
        )}
      </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading sources...</p>
      </div>
    );
  }

  const sources = sourceType === 'text' ? textSources : fileSources;

  return (
    <div className="flex flex-col h-full space-y-6">
      {renderHeader()}
      <KnowledgeUsageBar currentUsageKB={currentUsageKB} usageLimitKB={usageLimitKB} isLimitReached={isLimitReached} />

      {sources.length > 0 ? (
        <div className="space-y-3">
          {sourceType === 'text'
            ? textSources.map((text) => (
                <Card key={text.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium truncate">{text.title}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteText(text.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              ))
            : fileSources.map((file) => {
                const Icon = getFileIcon(file.type, file.name);
                return (
                    <Card key={file.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate" title={file.name}>{file.name}</span>
                        <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteFile(file.id!)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    </Card>
                )
            })}
        </div>
      ) : (
        <Card className="text-center flex-1 flex flex-col justify-center min-h-[200px]">
          <CardContent className="p-8">
            <p className="font-semibold">No {sourceType}s added yet</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              {sourceType === 'text' 
                ? 'Add training texts to provide your AI agent with specific knowledge and information.' 
                : 'Upload files to train your AI agent with documents and resources.'
              }
            </p>
             {sourceType === 'text' ? (
                <AddTextDialog>
                    <Button variant="secondary" className="mt-4" disabled={isLimitReached}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add text
                    </Button>
                </AddTextDialog>
             ) : (
                <AddFileDialog>
                    <Button variant="secondary" className="mt-4" disabled={isLimitReached}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Upload file
                    </Button>
                </AddFileDialog>
             )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
