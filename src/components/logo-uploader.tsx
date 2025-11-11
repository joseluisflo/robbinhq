
'use client';

import { useState, useRef, useEffect, type DragEvent, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';
import { useActiveAgent } from '@/app/(main)/layout';
import { updateAgent } from '@/app/actions/agents';


interface LogoUploaderProps {
  agent: Agent | null;
  onLogoChange: (file: File | null) => void;
  isSaving: boolean;
}

const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function LogoUploader({ agent, onLogoChange, isSaving }: LogoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, startUploading] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const { activeAgent, setActiveAgent } = useActiveAgent();
  
  useEffect(() => {
    if (isSaving && file) { 
        handleUpload();
    }
  }, [isSaving]);

  useEffect(() => {
    // Reset component state when agent changes
    if (agent) {
        setPreview(agent.logoUrl || null);
        setFile(null);
        if(inputRef.current) inputRef.current.value = '';
    } else {
        setPreview(null);
        setFile(null);
    }
  }, [agent]);


  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!SUPPORTED_FILE_TYPES.includes(selectedFile.type)) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a JPG, PNG, or SVG image.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Image must be smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
    setFile(selectedFile);
    onLogoChange(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file || !user || !activeAgent?.id) return;

    startUploading(async () => {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('agentId', activeAgent.id!);
      formData.append('uploadType', 'logo');

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
           const updateResult = await updateAgent(user.uid, activeAgent.id!, { logoUrl: result.url });
           if ('error' in updateResult) {
                toast({ title: 'Failed to save logo', description: updateResult.error, variant: 'destructive' });
           } else {
                toast({ title: 'Logo saved successfully!'});
                if (setActiveAgent && activeAgent) {
                    setActiveAgent({ ...activeAgent, logoUrl: result.url });
                }
           }
        } else {
          toast({ title: 'Logo upload failed', description: result.error || 'An unknown error occurred.', variant: 'destructive'});
        }
      } catch (e: any) {
        toast({ title: 'Logo upload failed', description: e.message || 'An unknown error occurred.', variant: 'destructive'});
      }
    });
  };


  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]!);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveLogo = async () => {
    if (!user || !activeAgent?.id) return;
    
    // Optimistically update UI
    setPreview(null);
    setFile(null);
    onLogoChange(null);
    if (inputRef.current) inputRef.current.value = '';

    // Update firestore
    const updateResult = await updateAgent(user.uid, activeAgent.id, { logoUrl: '' });
    if ('error' in updateResult) {
        toast({ title: 'Failed to remove logo', description: updateResult.error, variant: 'destructive' });
        // Revert optimistic update if failed
        setPreview(agent?.logoUrl || null);
    } else {
        toast({ title: 'Logo removed'});
        if (setActiveAgent && activeAgent) {
            setActiveAgent({ ...activeAgent, logoUrl: '' });
        }
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.substring(0, 2).toUpperCase();
  };


  const renderPreview = () => (
    <div className="relative group w-24 h-24">
      <Avatar className="w-full h-full rounded-md">
        {preview && <AvatarImage src={preview} alt="Logo Preview" className="object-cover" />}
        <AvatarFallback className="rounded-md bg-muted text-muted-foreground text-2xl font-bold">
            {getInitials(agent?.name || '')}
        </AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
        <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={handleRemoveLogo}
            disabled={isSaving || isUploading}
        >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  const renderUploader = () => (
    <div
      className={cn(
        'w-full h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-sm text-muted-foreground cursor-pointer transition-colors',
        isDragging ? 'border-primary bg-accent' : 'border-border'
      )}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-6 w-6 mb-1" />
      <span>Drag & drop or click</span>
      <span className="text-xs">JPG, PNG, SVG (Max 2MB)</span>
    </div>
  );
  
  return (
    <div className="flex items-center gap-4 w-full">
        {preview ? renderPreview() : renderUploader()}
        <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/svg+xml"
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
        />
    </div>
  );
}
