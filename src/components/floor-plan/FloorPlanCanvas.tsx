'use client';

import { useState } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RackItem } from './RackItem';
import type { Database, Json } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface Rack {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  total_u: number;
}

interface LocationData {
    id: string;
    name: string;
    floor_plan_image_url: string | null;
    grid_columns: number | null;
    grid_rows: number | null;
}

interface FloorPlanCanvasProps {
  locationData: LocationData;
  initialRacks: Rack[];
  tenantId: string;
}

// Sub-component for a droppable grid cell
function DroppableCell({ x, y, isOver }: { x: number; y: number; isOver: boolean }) {
  const id = `cell-${x}-${y}`;
  return (
    <div 
      id={id}
      className={cn(
        "border border-purple-500/10 transition-colors",
        isOver ? "bg-primary/30" : "bg-transparent"
      )}
      style={{
        gridColumnStart: x,
        gridRowStart: y,
      }}
    />
  );
}

export function FloorPlanCanvas({ locationData, initialRacks, tenantId }: FloorPlanCanvasProps) {
  const [racks, setRacks] = useState(initialRacks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const supabase = createClient();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragOver = (event: any) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (over && active.id !== over.id) {
      const draggedRackId = active.id as string;
      const dropZoneId = over.id as string;

      if (!dropZoneId.startsWith('cell-')) return;
      
      const [, newXStr, newYStr] = dropZoneId.split('-');
      const newX = parseInt(newXStr, 10);
      const newY = parseInt(newYStr, 10);
      
      // Optimistic UI update
      const originalRacks = [...racks];
      setRacks(prevRacks =>
        prevRacks.map(rack =>
          rack.id === draggedRackId ? { ...rack, pos_x: newX, pos_y: newY } : rack
        )
      );

      // Persist to database
      const { error } = await supabase
        .from('racks')
        .update({ pos_x: newX, pos_y: newY })
        .eq('id', draggedRackId);
        
      if (error) {
        toast({
          title: 'Error al mover el rack',
          description: error.message,
          variant: 'destructive',
        });
        // Revert optimistic update on failure
        setRacks(originalRacks);
      } else {
        toast({
          title: 'Rack movido',
          description: 'La nueva posición del rack ha sido guardada.',
        });
      }
    }
  };

  if (!locationData.grid_columns || !locationData.grid_rows) {
      return <div>Error: Grid dimensions not set for this location.</div>
  }

  const cols = locationData.grid_columns;
  const rows = locationData.grid_rows;

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
    >
        <div className="relative w-full aspect-video rounded-lg overflow-hidden glassmorphic-card p-1">
            {locationData.floor_plan_image_url ? (
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${locationData.floor_plan_image_url})` }}
                />
            ) : (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <p className="text-gray-500">Sin imagen de plano de planta.</p>
                </div>
            )}
            
            <div
                className="relative h-full w-full grid"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
            >
                {/* Render droppable grid cells */}
                {Array.from({ length: cols * rows }).map((_, index) => {
                    const x = (index % cols) + 1;
                    const y = Math.floor(index / cols) + 1;
                    const id = `cell-${x}-${y}`;
                    return <DroppableCell key={id} x={x} y={y} isOver={overId === id}/>;
                })}

                {/* Render draggable racks */}
                {racks.map(rack => (
                  rack.pos_x && rack.pos_y && <RackItem key={rack.id} rack={rack} />
                ))}
            </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
            <AlertTriangle className="h-4 w-4 text-amber-400"/>
            Los racks sin posición asignada no se mostrarán en el plano. Para asignarlos, edita el rack y establece sus coordenadas X/Y.
        </div>
    </DndContext>
  );
}
