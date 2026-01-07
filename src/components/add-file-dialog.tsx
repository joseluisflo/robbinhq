'use client';

import { useState, useRef, useTransition, type DragEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Upload, File as FileIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useActiveAgent } from '@/app/(main)/layout';
import { useUser } from '@/firebase';
import { useKnowledgeUsage } from '@/hooks/use-knowledge-usage';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import type { TextSource, AgentFile } from '@/lib/types';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const SUPPORTED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];


export function AddFileDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, startUploading] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { activeAgent, userProfile } = useActiveAgent();
  const { user } = useUser();
  const firestore = useFirestore();

  // --- Knowledge Usage ---
  const textsQuery = useMemo(() => 
    user && activeAgent?.id ? query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'texts')) : null,
  [user, activeAgent, firestore]);
  const { data: textSources } = useCollection<TextSource>(textsQuery);

  const filesQuery = useMemo(() =>
    user && activeAgent?.id ? query(collection(firestore, 'users', user.uid, 'agents', activeAgent.id, 'files')) : null,
  [user, activeAgent, firestore]);
  const { data: fileSources } = useCollection<AgentFile>(filesQuery);

  const { currentUsageKB, usageLimitKB } = useKnowledgeUsage(textSources, fileSources, userProfile);
  // --- End Knowledge Usage ---

  const triggerFileProcessing = async (fileId: string, agentId: string, token: string) => {
    try {
        const response = await fetch('/api/process-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ fileId, agentId }),
        });
        const result = await response.json();
        if (result.message) {
            toast({
                title: 'File processing notice',
                description: result.message,
                variant: 'default',
            });
        }
    } catch (e) {
        console.error('Failed to trigger file processing:', e);
        // Silently fail for now. The file is uploaded, but text extraction failed.
    }
  };


  const handleFiles = (newFiles: FileList) => {
    const totalFiles = files.length + newFiles.length;
    if (totalFiles > 10) {
      toast({
        title: 'File limit exceeded',
        description: 'You can upload a maximum of 10 files.',
        variant: 'destructive',
      });
      return;
    }
    
    let totalNewSizeKB = 0;
    const addedFiles: File[] = [];
    let hasError = false;

    Array.from(newFiles).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
        toast({
          title: 'File too large',
          description: `"${file.name}" exceeds the 10MB limit.`,
          variant: 'destructive',
        });
        hasError = true;
      } else if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        toast({
            title: 'Unsupported file type',
            description: `"${file.name}" is not a supported file type.`,
            variant: 'destructive',
        });
        hasError = true;
      } else {
        addedFiles.push(file);
        totalNewSizeKB += file.size / 1024;
      }
    });

    if (currentUsageKB + totalNewSizeKB > usageLimitKB) {
        toast({
            title: 'Storage limit exceeded',
            description: "Uploading these files would exceed your plan's storage limit.",
            variant: 'destructive',
        });
        hasError = true;
    }

    if (!hasError) {
      setFiles((prevFiles) => [...prevFiles, ...addedFiles]);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };


  const handleAddFiles = () => {
    if (!files.length || !user || !activeAgent?.id) return;
    
    startUploading(async () => {
      const token = await user.getIdToken();
      let successCount = 0;
      let errorCount = 0;

      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('agentId', activeAgent.id!);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          const result = await response.json();

          if (response.ok) {
            successCount++;
            // Don't wait for processing to finish, just trigger it.
            triggerFileProcessing(result.fileId, activeAgent.id!, token);
          } else {
            errorCount++;
            console.error(`Failed to upload ${file.name}:`, result.error);
          }
        } catch (e) {
          errorCount++;
          console.error(`Exception during upload of ${file.name}:`, e);
        }
      });
      
      await Promise.all(uploadPromises);

      if (errorCount > 0) {
        toast({
          title: 'Upload finished with errors',
          description: `${successCount} file(s) uploaded successfully, ${errorCount} failed.`,
          variant: errorCount > 0 && successCount > 0 ? 'default' : 'destructive',
        });
      } else {
        toast({ title: 'Upload successful', description: `${successCount} file(s) have been added.` });
      }

      setIsOpen(false);
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setFiles([]);
        setIsDragging(false);
      }, 200);
    }
  };

  const hasFiles = files.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Add files to train your AI agent. Supported types: .txt, .md, .html, .pdf, .doc, .docx
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'mt-4 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors',
            isDragging ? 'border-primary bg-accent' : 'border-border'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground">Drag & drop or click to browse</p>
            <p className="text-xs">Max 10 files · Up to 10MB/file</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".txt,.md,.html,.htm,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-48">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className={cn("grid gap-2", hasFiles ? "grid-cols-3" : "grid-cols-2")}>
            {hasFiles && (
                <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setFiles([])}
                    disabled={isUploading}
                    className="w-full"
                >
                    Remove all
                </Button>
            )}
             <DialogClose asChild className="w-full">
                <Button type="button" variant="outline" disabled={isUploading}>
                    Cancel
                </Button>
            </DialogClose>
            <Button
                type="button"
                onClick={handleAddFiles}
                disabled={files.length === 0 || isUploading}
                className="w-full"
            >
                {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                    `Add ${files.length} file${files.length === 1 ? '' : 's'}`
                )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}