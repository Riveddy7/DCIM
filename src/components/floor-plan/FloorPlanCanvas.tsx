
'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RackItem } from './RackItem';
import { UnplacedRackItem } from './UnplacedRackItem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
  onRacksUpdate: () => void;
}

function GridCell({ x, y, onPlace, isPlacing }: { x: number; y: number; onPlace: (x: number, y: number) => void; isPlacing: boolean }) {
  return (
    <div 
      className={cn(
        "border border-purple-500/20 transition-colors",
        isPlacing && "cursor-copy hover:bg-primary/30"
      )}
      style={{
        gridColumnStart: x,
        gridRowStart: y,
      }}
      onClick={() => onPlace(x, y)}
    />
  );
}


export function FloorPlanCanvas({ locationData, initialRacks, tenantId, isEditMode, onRacksUpdate }: FloorPlanCanvasProps) {
  const [racks, setRacks] = useState(initialRacks);
  const [rackToPlaceId, setRackToPlaceId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  
  useEffect(() => {
    setRacks(initialRacks);
  }, [initialRacks]);

  // When exiting edit mode, clear any selected rack
  useEffect(() => {
    if (!isEditMode) {
      setRackToPlaceId(null);
    }
  }, [isEditMode]);

  const placedRacks = useMemo(() => racks.filter(r => r.pos_x && r.pos_y), [racks]);
  const unplacedRacks = useMemo(() => racks.filter(r => !r.pos_x || !r.pos_y), [racks]);

  const handleSelectRackToPlace = (rackId: string) => {
    setRackToPlaceId(prevId => prevId === rackId ? null : rackId);
  }

  const handlePlaceRack = async (x: number, y: number) => {
    if (!rackToPlaceId || isPlacing) return;
    setIsPlacing(true);
    
    if (placedRacks.some(r => r.pos_x === x && r.pos_y === y)) {
        toast({ title: 'Celda Ocupada', description: 'Ya existe un rack en esta posición.', variant: 'destructive' });
        setIsPlacing(false);
        return;
    }
    
    const rackName = racks.find(r => r.id === rackToPlaceId)?.name || 'El rack';
    const placingId = rackToPlaceId;
    setRackToPlaceId(null); 

    const { error } = await supabase
      .from('racks')
      .update({ pos_x: x, pos_y: y })
      .eq('id', placingId);
      
    if (error) {
      toast({ title: 'Error al colocar el rack', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rack Colocado', description: `${rackName} ha sido posicionado en (${x}, ${y}).` });
      onRacksUpdate();
    }
    
    setIsPlacing(false);
  };
  
  const handleUnplaceRack = async (rackId: string) => {
    if (isPlacing) return;
    setIsPlacing(true);
    
     const { error } = await supabase
      .from('racks')
      .update({ pos_x: null, pos_y: null })
      .eq('id', rackId);
      
     if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
     } else {
        toast({ title: 'Rack devuelto a la paleta.' });
        onRacksUpdate();
     }
     setIsPlacing(false);
   };

  if (!locationData.grid_columns || !locationData.grid_rows) {
      return <div>Error: Grid dimensions not set for this location.</div>
  }

  const cols = locationData.grid_columns;
  const rows = locationData.grid_rows;

  return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className={cn("relative w-full aspect-video rounded-lg overflow-hidden glassmorphic-card p-1 flex-grow", rackToPlaceId && isEditMode && 'cursor-copy')}>
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
                        return <GridCell key={`cell-${x}-${y}`} x={x} y={y} onPlace={handlePlaceRack} isPlacing={!!rackToPlaceId} />;
                    })}
                  </>
                )}

                {placedRacks.map(rack => (
                  <RackItem key={rack.id} rack={rack} isEditMode={isEditMode} onUnplace={handleUnplaceRack} />
                ))}
            </div>
        </div>

        {isEditMode && (
          <Card className="glassmorphic-card w-full md:w-64 order-first md:order-last">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Racks sin Colocar</CardTitle>
              <CardDescription className="text-xs">Selecciona un rack y haz clic en una celda vacía para colocarlo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {isPlacing && <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}
              {unplacedRacks.length > 0 ? (
                unplacedRacks.map(rack => (
                  <UnplacedRackItem 
                    key={rack.id} 
                    rack={rack}
                    onClick={() => handleSelectRackToPlace(rack.id)}
                    isSelected={rack.id === rackToPlaceId}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Todos los racks están en el plano.</p>
              )}
            </CardContent>
          </Card>
        )}

       {!isEditMode && unplacedRacks.length > 0 && (
         <div className="flex items-center gap-2 text-xs text-amber-400 mt-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4"/>
            Hay {unplacedRacks.length} rack(s) sin posición asignada. Activa el "Modo Edición" para colocarlos en el plano.
        </div>
       )}
    </div>
  );
}
