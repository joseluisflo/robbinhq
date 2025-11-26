
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Info, Loader2, PlusCircle, Trash2, FileText, File as FileIcon } from 'lucide-react';
import { AddTextDialog } from '@/components/add-text-dialog';
import { AddFileDialog } from '@/components/add-file-dialog';
import type { TextSource, AgentFile } from '@/lib/types';

interface KnowledgeSourcesProps {
  textSources: TextSource[] | null;
  fileSources: AgentFile[] | null;
  textsLoading: boolean;
  filesLoading: boolean;
  handleDeleteText: (id: string) => void;
  handleDeleteFile: (id: string) => void;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function KnowledgeSources({
  textSources,
  fileSources,
  textsLoading,
  filesLoading,
  handleDeleteText,
  handleDeleteFile,
}: KnowledgeSourcesProps) {
  return (
    <div className='space-y-6'>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            Texts
            <Info className="h-4 w-4 text-muted-foreground" />
          </Label>
          <AddTextDialog>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </AddTextDialog>
        </div>
        
        {textsLoading ? (
          <div className="text-center py-12">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading texts...</p>
          </div>
        ) : textSources && textSources.length > 0 ? (
          <div className="space-y-3">
            {textSources.map((text) => (
              <Card key={text.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium truncate">{text.title}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteText(text.id!)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center flex-1 flex flex-col justify-center min-h-[200px]">
            <CardContent className="p-8">
              <p className="font-semibold">No texts added yet</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Add training texts to provide your AI agent with specific knowledge and information.
              </p>
              <AddTextDialog>
                <Button variant="secondary" className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add text
                </Button>
              </AddTextDialog>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex flex-col mt-6">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            Files
            <Info className="h-4 w-4 text-muted-foreground" />
          </Label>
            <AddFileDialog>
            <Button variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </AddFileDialog>
        </div>
        
        {filesLoading ? (
          <div className="text-center py-12">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading files...</p>
          </div>
        ) : fileSources && fileSources.length > 0 ? (
          <div className="space-y-3">
            {fileSources.map((file) => (
              <Card key={file.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium truncate" title={file.name}>{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleDeleteFile(file.id!)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center flex-1 flex flex-col justify-center min-h-[200px]">
            <CardContent className="p-8">
              <p className="font-semibold">No files added yet</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Upload files to train your AI agent with documents and resources.
              </p>
              <AddFileDialog>
                <Button variant="secondary" className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Upload file
                </Button>
              </AddFileDialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
