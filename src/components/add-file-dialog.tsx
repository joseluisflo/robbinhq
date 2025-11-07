'use client';

import { useState, useCallback, useRef, type DragEvent } from 'react';
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
import { Upload, File as FileIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function AddFileDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

    const addedFiles: File[] = [];
    let hasError = false;

    Array.from(newFiles).forEach((file) => {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `"${file.name}" exceeds the 100MB limit.`,
          variant: 'destructive',
        });
        hasError = true;
      } else {
        addedFiles.push(file);
      }
    });

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
    console.log('Adding files:', files.map(f => f.name));
    toast({ title: `${files.length} file(s) added for training.` });
    setIsOpen(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            Add files to train your AI agent.
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
            <p className="text-xs">All files · Max 10 files · Up to 100MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
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

        <DialogFooter className="mt-4 sm:justify-between items-center">
          {files.length > 0 ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setFiles([])}
              className="order-1 sm:order-none"
            >
              Remove all files
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={handleAddFiles}
              disabled={files.length === 0}
            >
              Add {files.length > 0 ? files.length : ''} file{files.length === 1 ? '' : 's'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
