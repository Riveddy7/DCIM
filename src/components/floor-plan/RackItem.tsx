
'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Server, Undo2 } from 'lucide-react';

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
  onUnplace: (rackId: string) => void;
}

export function RackItem({ rack, isEditMode, onUnplace }: RackItemProps) {
  const style = {
    gridColumnStart: rack.pos_x ?? undefined,
    gridRowStart: rack.pos_y ?? undefined,
    zIndex: 10,
  };

  return (
    <div
      style={style}
      className={cn(
        "relative flex group items-center justify-center p-1 rounded-sm",
        "bg-primary/70 border border-primary-foreground/50 text-primary-foreground",
        "transition-all"
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center w-full h-full">
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

      {isEditMode && (
        <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={(e) => {
                e.stopPropagation();
                onUnplace(rack.id);
            }}
            title="Devolver a la paleta"
        >
            <Undo2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
