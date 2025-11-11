'use client';

import { useState, useRef, useEffect, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import type { Agent } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LogoUploaderProps {
  agent: Agent | null;
  onLogoChange: (file: File | null) => void;
  isSaving: boolean;
}

const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function LogoUploader({ agent, onLogoChange, isSaving }: LogoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // If there's an existing logoUrl and no new preview, show the existing logo.
    if (agent?.logoUrl && !preview) {
      setPreview(agent.logoUrl);
    }
    // If the agent changes and has no logo, clear the preview.
    if (!agent?.logoUrl && !preview) {
      setPreview(null);
    }
  }, [agent?.logoUrl]);


  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      toast({
        title: 'Unsupported file type',
        description: 'Please upload a JPG, PNG, or SVG image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
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
    reader.readAsDataURL(file);
    onLogoChange(file);
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

  const handleRemoveLogo = () => {
    setPreview(null);
    onLogoChange(null); // Signal to parent that we want to remove the logo
    if (inputRef.current) {
        inputRef.current.value = '';
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.substring(0, 2).toUpperCase();
  };


  const renderPreview = () => (
    <div className="relative group w-24 h-24">
      <Avatar className="w-full h-full rounded-md">
        <AvatarImage src={preview!} alt="Logo Preview" className="object-cover" />
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
            disabled={isSaving}
        >
            <X className="h-4 w-4" />
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
    <div className="flex items-center gap-4">
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
