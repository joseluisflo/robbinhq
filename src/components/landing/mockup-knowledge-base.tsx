'use client';

import { File, FileText, Trash2, FileUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const knowledgeFiles = [
    {
        name: 'Product Catalog 2024.pdf',
        size: '2.3 MB',
        icon: File,
    },
    {
        name: 'Return Policy.txt',
        size: '15 KB',
        icon: FileText,
    },
    {
        name: 'Onboarding Guide.docx',
        size: '890 KB',
        icon: File,
    },
];

export function MockupKnowledgeBase() {
    return (
        <div className="w-full max-w-sm mx-auto p-4 space-y-3">
            {knowledgeFiles.map((file, index) => (
                <Card key={index} className="flex items-center justify-between p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <file.icon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 group">
                        <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                    </Button>
                </Card>
            ))}
        </div>
    );
}
