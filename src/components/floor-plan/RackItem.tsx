
'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Server } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Rack {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  total_u: number;
}

interface RackItemProps {
  rack: Rack;
  isEditMode: boolean;
}

export function RackItem({ rack, isEditMode }: RackItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: rack.id,
    disabled: !isEditMode,
  });

  const style = {
    gridColumnStart: rack.pos_x ?? undefined,
    gridRowStart: rack.pos_y ?? undefined,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 100 : 10,
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.2), 0 6px 6px rgba(0,0,0,0.25)' : undefined,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
              "relative flex items-center justify-center p-1 rounded-sm",
              "bg-primary/70 border border-primary-foreground/50 text-primary-foreground",
              "hover:bg-primary hover:z-20 transition-all",
              isEditMode && "cursor-grab",
              isDragging && "cursor-grabbing z-50",
            )}
          >
            <Server className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">{rack.name}</p>
          <p className="text-xs text-gray-400">Pos: ({rack.pos_x}, {rack.pos_y})</p>
          <p className="text-xs text-gray-400">Tamaño: {rack.total_u}U</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
