
'use client';

import {
  CheckCircle2,
  FilePlus2,
  MessageSquare,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const mockLogs = [
  {
    type: 'Tarea iniciada',
    icon: PlayCircle,
    color: 'text-blue-500',
    description: "La tarea 'Generar reporte de ventas' ha comenzado.",
    time: 'hace 5 minutos',
  },
  {
    type: 'Workflow ejecutado',
    icon: CheckCircle2,
    color: 'text-green-500',
    description:
      "El workflow 'Bienvenida a nuevo cliente' se completó exitosamente.",
    time: 'hace 2 horas',
  },
  {
    type: 'Error',
    icon: XCircle,
    color: 'text-red-500',
    description:
      "Falló el envío de email a 'cliente@email.com'. Razón: API key inválida.",
    time: 'ayer',
  },
  {
    type: 'Conocimiento actualizado',
    icon: FilePlus2,
    color: 'text-purple-500',
    description:
      "Se añadió el archivo 'nuevos_precios_2024.pdf' a la base de conocimiento.",
    time: 'hace 2 días',
  },
  {
    type: 'Interacción',
    icon: MessageSquare,
    color: 'text-gray-500',
    description:
      'Conversación iniciada en el widget de chat con un visitante de España.',
    time: 'hace 3 días',
  },
];

export function LogSettings() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-semibold">Event Logs</h3>
        <p className="text-sm text-muted-foreground">
          A chronological log of important actions performed by your agent.
        </p>
      </div>
      <div className="space-y-4">
        {mockLogs.map((log, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-4 flex items-start gap-4">
               <div
                className={cn(
                  'mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted',
                  log.color
                )}
              >
                <log.icon className="h-5 w-5" />
              </div>
               <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{log.type}</p>
                    <p className="text-xs text-muted-foreground">{log.time}</p>
                </div>
                <p className="text-sm text-muted-foreground">{log.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
