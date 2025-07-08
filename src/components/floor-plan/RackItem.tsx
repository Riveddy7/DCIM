
'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Server, Undo2, Move3D } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ThemeType } from './FloorPlanThemes';

// Theme styling function
function getThemeStyles(theme: ThemeType, rack: Rack): string {
  const baseStyles = "border border-primary-foreground/50 text-primary-foreground hover:scale-105";
  
  switch (theme) {
    case 'capacity':
      // Example: Color based on rack utilization (would need actual data)
      const utilization = Math.random(); // Placeholder - would calculate from actual data
      if (utilization < 0.3) return `${baseStyles} bg-green-500/70 hover:bg-green-500/80`;
      if (utilization < 0.7) return `${baseStyles} bg-yellow-500/70 hover:bg-yellow-500/80`;
      return `${baseStyles} bg-red-500/70 hover:bg-red-500/80`;
      
    case 'power':
      // Example: Color based on power consumption
      const powerLevel = Math.random(); // Placeholder
      if (powerLevel < 0.4) return `${baseStyles} bg-blue-500/70 hover:bg-blue-500/80`;
      if (powerLevel < 0.8) return `${baseStyles} bg-yellow-500/70 hover:bg-yellow-500/80`;
      return `${baseStyles} bg-red-500/70 hover:bg-red-500/80`;
      
    case 'network':
      // Example: Color based on network connectivity
      const connectivity = Math.random(); // Placeholder
      if (connectivity > 0.8) return `${baseStyles} bg-green-500/70 hover:bg-green-500/80`;
      if (connectivity > 0.5) return `${baseStyles} bg-yellow-500/70 hover:bg-yellow-500/80`;
      return `${baseStyles} bg-red-500/70 hover:bg-red-500/80`;
      
    case 'status':
      // Example: Color based on operational status
      const statuses = ['operational', 'warning', 'error', 'unknown'];
      const status = statuses[Math.floor(Math.random() * statuses.length)]; // Placeholder
      switch (status) {
        case 'operational': return `${baseStyles} bg-green-500/70 hover:bg-green-500/80`;
        case 'warning': return `${baseStyles} bg-yellow-500/70 hover:bg-yellow-500/80`;
        case 'error': return `${baseStyles} bg-red-500/70 hover:bg-red-500/80`;
        default: return `${baseStyles} bg-gray-500/70 hover:bg-gray-500/80`;
      }
      
    case 'temperature':
      // Example: Color based on temperature
      const temp = 20 + Math.random() * 15; // 20-35°C range
      if (temp < 22) return `${baseStyles} bg-blue-500/70 hover:bg-blue-500/80`;
      if (temp < 26) return `${baseStyles} bg-green-500/70 hover:bg-green-500/80`;
      if (temp < 30) return `${baseStyles} bg-yellow-500/70 hover:bg-yellow-500/80`;
      return `${baseStyles} bg-red-500/70 hover:bg-red-500/80`;
      
    default:
      return `${baseStyles} bg-primary/90 hover:bg-primary border-primary/70 shadow-lg`;
  }
}

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
  isSelected?: boolean;
  currentTheme?: ThemeType;
  onUnplace: (rackId: string) => void;
  onSelect?: (rackId: string) => void;
  onMove?: (rackId: string) => void;
}

export function RackItem({ rack, isEditMode, isSelected = false, currentTheme = 'default', onUnplace, onSelect, onMove }: RackItemProps) {
  const style = {
    gridColumnStart: rack.pos_x ?? undefined,
    gridRowStart: rack.pos_y ?? undefined,
    zIndex: 20, // Higher z-index to ensure racks appear above grid cells
  };

  return (
    <motion.div
      style={style}
      className={cn(
        "relative flex group items-center justify-center rounded-sm cursor-pointer",
        "transition-all duration-200 hover:scale-110 hover:shadow-xl",
        "p-1 sm:p-2 min-h-[32px] sm:min-h-[40px] min-w-[32px] sm:min-w-[40px] touch-manipulation",
        "border-2 backdrop-blur-sm",
        isSelected 
          ? "bg-purple-500/90 border-purple-300 text-purple-100 ring-2 ring-purple-400/50 shadow-xl z-30"
          : getThemeStyles(currentTheme, rack)
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="flex items-center justify-center w-full h-full"
              onClick={() => onSelect?.(rack.id)}
            >
               <Server className="h-3 w-3 sm:h-4 sm:w-4" />
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
            className="absolute -top-2 -right-2 h-6 w-6 sm:h-5 sm:w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 touch-manipulation"
            onClick={(e) => {
                e.stopPropagation();
                onUnplace(rack.id);
            }}
            title="Devolver a la paleta"
        >
            <Undo2 className="h-3 w-3" />
        </Button>
      )}
      
      {isEditMode && onMove && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity z-30"
        >
          <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 sm:h-5 sm:w-5 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
              onClick={(e) => {
                  e.stopPropagation();
                  onMove(rack.id);
              }}
              title="Mover rack"
          >
              <Move3D className="h-3 w-3" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
