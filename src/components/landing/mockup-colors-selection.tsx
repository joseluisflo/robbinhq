'use client';

import { cn } from "@/lib/utils";

const colors = [
  'bg-red-400', 'bg-blue-400',
  'bg-green-400', 'bg-yellow-400', 'bg-indigo-400', 'bg-pink-400',
  'bg-purple-400', 'bg-teal-400',
];

const ColorCircle = ({ colorClass }: { colorClass: string }) => (
  <div className={cn("w-10 h-10 rounded-full shadow-inner", colorClass)} />
);

export function MockupColorsSelection({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Fila superior: 2 círculos */}
      <div className="flex gap-2">
        <ColorCircle colorClass={colors[0]} />
        <ColorCircle colorClass={colors[1]} />
      </div>
      {/* Fila del medio: 4 círculos */}
      <div className="flex gap-2 -mx-5">
        <ColorCircle colorClass={colors[2]} />
        <ColorCircle colorClass={colors[3]} />
        <ColorCircle colorClass={colors[4]} />
        <ColorCircle colorClass={colors[5]} />
      </div>
      {/* Fila inferior: 2 círculos */}
      <div className="flex gap-2">
        <ColorCircle colorClass={colors[6]} />
        <ColorCircle colorClass={colors[7]} />
      </div>
    </div>
  );
}
