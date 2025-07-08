'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Wifi, Undo2, Move3D } from 'lucide-react';
import { motion } from 'framer-motion';

interface Endpoint {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  rack_id?: string | null;
  asset_type: string;
  status: string;
}

interface EndpointItemProps {
  endpoint: Endpoint;
  isEditMode: boolean;
  isSelected?: boolean;
  onUnplace: (endpointId: string) => void;
  onSelect?: (endpointId: string) => void;
  onMove?: (endpointId: string) => void;
}

export function EndpointItem({ 
  endpoint, 
  isEditMode, 
  isSelected = false, 
  onUnplace, 
  onSelect, 
  onMove 
}: EndpointItemProps) {
  const style = {
    gridColumnStart: endpoint.pos_x ?? undefined,
    gridRowStart: endpoint.pos_y ?? undefined,
    zIndex: 15, // Lower than racks but above grid cells
  };

  // Get status color
  const getStatusColor = () => {
    switch (endpoint.status) {
      case 'IN_PRODUCTION':
        return 'bg-green-500/70 hover:bg-green-500/80 border-green-400/50';
      case 'PLANNED':
        return 'bg-blue-500/70 hover:bg-blue-500/80 border-blue-400/50';
      case 'INACTIVE':
        return 'bg-gray-500/70 hover:bg-gray-500/80 border-gray-400/50';
      default:
        return 'bg-amber-500/70 hover:bg-amber-500/80 border-amber-400/50';
    }
  };

  return (
    <motion.div
      style={style}
      className={cn(
        "relative flex group items-center justify-center rounded-full cursor-pointer",
        "transition-all duration-200 hover:scale-125 hover:shadow-lg",
        "p-1 min-h-[16px] min-w-[16px] max-h-[20px] max-w-[20px] touch-manipulation",
        "border backdrop-blur-sm",
        isSelected 
          ? "bg-purple-500/90 border-purple-300 text-purple-100 ring-2 ring-purple-400/50 shadow-xl z-30"
          : getStatusColor()
      )}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      whileHover={{ scale: 1.3 }}
      transition={{ duration: 0.2 }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="flex items-center justify-center w-full h-full"
              onClick={() => onSelect?.(endpoint.id)}
            >
               <Wifi className="h-2 w-2" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-bold">{endpoint.name}</p>
            <p className="text-xs text-gray-400">Pos: ({endpoint.pos_x}, {endpoint.pos_y})</p>
            <p className="text-xs text-gray-400">Estado: {endpoint.status}</p>
            <p className="text-xs text-gray-400">Tipo: Endpoint</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isEditMode && (
        <Button
            variant="destructive"
            size="icon"
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 touch-manipulation"
            onClick={(e) => {
                e.stopPropagation();
                onUnplace(endpoint.id);
            }}
            title="Devolver a la paleta"
        >
            <Undo2 className="h-2 w-2" />
        </Button>
      )}
      
      {isEditMode && onMove && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity z-30"
        >
          <Button
              variant="secondary"
              size="icon"
              className="h-4 w-4 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
              onClick={(e) => {
                  e.stopPropagation();
                  onMove(endpoint.id);
              }}
              title="Mover endpoint"
          >
              <Move3D className="h-2 w-2" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}