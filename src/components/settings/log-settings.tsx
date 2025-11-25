
'use client';

import {
  ArrowDownCircle,
  CheckCircle2,
  FilePlus2,
  MessageSquare,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mockLogs = [
  {
    type: 'Tarea iniciada',
    icon: PlayCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    description: "La tarea 'Generar reporte de ventas' ha comenzado.",
    time: 'hace 5 minutos',
  },
  {
    type: 'Workflow ejecutado',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    description:
      "El workflow 'Bienvenida a nuevo cliente' se completó exitosamente.",
    time: 'hace 2 horas',
  },
  {
    type: 'Error',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    description:
      "Falló el envío de email a 'cliente@email.com'. Razón: API key inválida.",
    time: 'ayer',
  },
  {
    type: 'Conocimiento actualizado',
    icon: FilePlus2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
    description:
      "Se añadió el archivo 'nuevos_precios_2024.pdf' a la base de conocimiento.",
    time: 'hace 2 días',
  },
  {
    type: 'Interacción',
    icon: MessageSquare,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500',
    description:
      'Conversación iniciada en el widget de chat con un visitante de España.',
    time: 'hace 3 días',
  },
];

export function LogSettings() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-semibold">Event Timeline</h3>
        <p className="text-sm text-muted-foreground">
          A chronological log of important actions performed by your agent.
        </p>
      </div>
      <div className="relative pl-6">
        {/* The vertical line */}
        <div className="absolute left-[35px] top-0 h-full w-0.5 -translate-x-1/2 transform bg-border" />

        <ul className="space-y-8">
          {mockLogs.map((log, index) => (
            <li key={index} className="relative flex items-start gap-4">
              <div
                className={cn(
                  'relative mt-1 flex h-8 w-8 items-center justify-center rounded-full',
                  log.bgColor
                )}
              >
                <log.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{log.description}</p>
                <p className="text-sm text-muted-foreground">{log.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
