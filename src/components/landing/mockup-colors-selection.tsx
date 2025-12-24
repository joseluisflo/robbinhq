
'use client';

import { cn } from "@/lib/utils";

const colors = [
  'bg-red-400', 'bg-orange-400', 'bg-amber-400',
  'bg-yellow-400', 'bg-lime-400', 'bg-green-400', 'bg-emerald-400',
  'bg-teal-400', 'bg-cyan-400', 'bg-sky-400'
];

const ColorCircle = ({ colorClass }: { colorClass: string }) => (
  <div className={cn("w-10 h-10 rounded-full shadow-inner", colorClass)} />
);

export function MockupColorsSelection({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Fila superior: 3 círculos */}
      <div className="flex gap-2">
        <ColorCircle colorClass={colors[0]} />
        <ColorCircle colorClass={colors[1]} />
        <ColorCircle colorClass={colors[2]} />
      </div>
      {/* Fila del medio: 4 círculos */}
      <div className="flex gap-2 -mx-5">
        <ColorCircle colorClass={colors[3]} />
        <ColorCircle colorClass={colors[4]} />
        <ColorCircle colorClass={colors[5]} />
        <ColorCircle colorClass={colors[6]} />
      </div>
      {/* Fila inferior: 3 círculos */}
      <div className="flex gap-2">
        <ColorCircle colorClass={colors[7]} />
        <ColorCircle colorClass={colors[8]} />
        <ColorCircle colorClass={colors[9]} />
      </div>
    </div>
  );
}
