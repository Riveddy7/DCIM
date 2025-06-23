
'use client';

import { useState, useMemo } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RackItem } from './RackItem';
import { UnplacedRackItem } from './UnplacedRackItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Server } from 'lucide-react';

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
  isEditMode: boolean;
}

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

export function FloorPlanCanvas({ locationData, initialRacks, tenantId, isEditMode }: FloorPlanCanvasProps) {
  const [racks, setRacks] = useState(initialRacks);
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

  const placedRacks = useMemo(() => racks.filter(r => r.pos_x && r.pos_y), [racks]);
  const unplacedRacks = useMemo(() => racks.filter(r => !r.pos_x || !r.pos_y), [racks]);

  const handleDragOver = (event: any) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setOverId(null);
    const { active, over } = event;

    if (!over || !over.id.toString().startsWith('cell-')) {
      // Invalid drop zone, do nothing.
      return;
    }

    const draggedRackId = active.id as string;
    const dropZoneId = over.id as string;
    
    const [, newXStr, newYStr] = dropZoneId.split('-');
    const newX = parseInt(newXStr, 10);
    const newY = parseInt(newYStr, 10);
    
    const originalRacks = [...racks];
    setRacks(prevRacks =>
      prevRacks.map(rack =>
        rack.id === draggedRackId ? { ...rack, pos_x: newX, pos_y: newY } : rack
      )
    );

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
      setRacks(originalRacks);
    } else {
      toast({
        title: 'Rack movido',
        description: 'La nueva posición del rack ha sido guardada.',
      });
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
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden glassmorphic-card p-1 flex-grow">
            <div
                className={cn(
                  "absolute inset-0 bg-cover bg-center transition-opacity grayscale opacity-30"
                )}
                style={{ backgroundImage: `url(${locationData.floor_plan_image_url})` }}
            />
            
            <div
                className="relative h-full w-full grid"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
            >
                {isEditMode && (
                  <>
                    {Array.from({ length: cols * rows }).map((_, index) => {
                        const x = (index % cols) + 1;
                        const y = Math.floor(index / cols) + 1;
                        const id = `cell-${x}-${y}`;
                        return <DroppableCell key={id} x={x} y={y} isOver={overId === id}/>;
                    })}
                  </>
                )}

                {placedRacks.map(rack => (
                  <RackItem key={rack.id} rack={rack} isEditMode={isEditMode} />
                ))}
            </div>
        </div>

        {isEditMode && (
          <Card className="glassmorphic-card w-full md:w-64 order-first md:order-last">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Racks sin Colocar</CardTitle>
              <CardDescription className="text-xs">Arrastra un rack al plano para posicionarlo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {unplacedRacks.length > 0 ? (
                unplacedRacks.map(rack => (
                  <UnplacedRackItem key={rack.id} rack={rack} />
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Todos los racks están en el plano.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

       {!isEditMode && unplacedRacks.length > 0 && (
         <div className="flex items-center gap-2 text-xs text-amber-400 mt-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4"/>
            Hay {unplacedRacks.length} rack(s) sin posición asignada. Activa el "Modo Edición" para colocarlos en el plano.
        </div>
       )}

    </DndContext>
  );
}
