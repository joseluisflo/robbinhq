
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CheckCircle, XCircle, Loader2, MessageSquare, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";


const mockLogsWithSteps = [
  {
    id: "log-1",
    title: "Workflow 'Bienvenida a nuevo cliente' ejecutado",
    origin: "Chat",
    status: "success",
    timestamp: "hace 2 horas",
    steps: [
      { id: "step-1-1", description: "Trigger activado por mensaje de usuario.", timestamp: "10:05:01 AM" },
      { id: "step-1-2", description: "Buscando información del cliente en la base de datos.", timestamp: "10:05:02 AM" },
      { id: "step-1-3", description: "Generando mensaje de bienvenida personalizado.", timestamp: "10:05:03 AM" },
      { id: "step-1-4", description: "Respuesta enviada al usuario.", timestamp: "10:05:04 AM" },
    ]
  },
  {
    id: "log-2",
    title: "Error al enviar email de seguimiento",
    origin: "Email",
    status: "error",
    timestamp: "ayer",
    steps: [
        { id: "step-2-1", description: "Intentando enviar email a 'cliente@email.com'.", timestamp: "Ayer, 3:30:15 PM" },
        { id: "step-2-2", description: "Error de autenticación con el proveedor de email.", timestamp: "Ayer, 3:30:16 PM" },
        { id: "step-2-3", description: "Reintentando envío (1/3).", timestamp: "Ayer, 3:30:46 PM" },
        { id: "step-2-4", description: "Fallo final en el envío. Razón: API key inválida.", timestamp: "Ayer, 3:31:16 PM" },
    ]
  },
  {
    id: "log-3",
    title: "Llamada entrante de +1-202-555-0104",
    origin: "In-Call",
    status: "in-progress",
    timestamp: "ahora",
    steps: [
        { id: "step-3-1", description: "Llamada conectada.", timestamp: "1:15:20 PM" },
        { id: "step-3-2", description: "Transcribiendo audio de usuario en tiempo real.", timestamp: "1:15:22 PM" },
    ]
  },
];

const originIcons: Record<string, React.ElementType> = {
  Chat: MessageSquare,
  Email: Mail,
  'In-Call': Phone,
  Phone: Phone,
};

const statusInfo: Record<string, { icon: React.ElementType, color: string }> = {
    success: { icon: CheckCircle, color: 'text-green-500' },
    error: { icon: XCircle, color: 'text-red-500' },
    'in-progress': { icon: Loader2, color: 'text-blue-500' },
};


export function LogSettings() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-semibold">Event Logs</h3>
        <p className="text-sm text-muted-foreground">
          A chronological log of important actions performed by your agent.
        </p>
      </div>
       <Accordion type="single" collapsible className="w-full space-y-2">
        {mockLogsWithSteps.map((log) => {
            const OriginIcon = originIcons[log.origin] || MessageSquare;
            const StatusIcon = statusInfo[log.status]?.icon || CheckCircle;

            return (
              <AccordionItem key={log.id} value={log.id} className="border rounded-lg bg-card">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-center gap-4 text-sm w-full">
                     <div className="flex items-center gap-2 w-1/3">
                        <StatusIcon className={cn("h-4 w-4", statusInfo[log.status]?.color, log.status === 'in-progress' && 'animate-spin')} />
                        <span className="font-medium truncate">{log.title}</span>
                     </div>
                     <div className="flex items-center gap-2 text-muted-foreground w-1/3">
                        <OriginIcon className="h-4 w-4" />
                        <span>{log.origin}</span>
                     </div>
                      <span className="text-muted-foreground ml-auto">{log.timestamp}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t">
                  <div className="p-4 text-sm text-muted-foreground">
                     <ul className="space-y-2">
                        {log.steps.map(step => (
                            <li key={step.id} className="flex items-center justify-between">
                                <span>{step.description}</span>
                                <span className="text-xs font-mono">{step.timestamp}</span>
                            </li>
                        ))}
                     </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
        })}
      </Accordion>
    </div>
  );
}
