
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedPerformance, useThrottle } from '@/hooks/use-performance';
import { RackItem } from './RackItem';
import { UnplacedRackItem } from './UnplacedRackItem';
import { RackInfoPanel } from './RackInfoPanel';
import { RackSearchFilter } from './RackSearchFilter';
import { EndpointItem } from './EndpointItem';
import { EndpointFilter } from './EndpointFilter';
import { FloorPlanKeyboardShortcuts } from './FloorPlanKeyboardShortcuts';
import { FloorPlanImageTools } from './FloorPlanImageTools';
import { FloorPlanZoom } from './FloorPlanZoom';
import { OptimizedFloorPlanImage } from './OptimizedFloorPlanImage';
import { VirtualizedGrid } from './VirtualizedGrid';
import type { ThemeType } from './FloorPlanThemes';
import { getImageFilter, getImageContainerClasses, getImageTransitionClasses } from './ImageFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Database } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, Move3D } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Rack {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  total_u: number;
}

interface Endpoint {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  rack_id?: string | null;
  asset_type: string;
  status: string;
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
  initialEndpoints?: Endpoint[];
  tenantId: string;
  isEditMode: boolean;
  currentTheme?: ThemeType;
  showImageTools?: boolean;
  onRacksUpdate: () => void;
  onEndpointsUpdate?: () => void;
  onToggleImageTools?: () => void;
}

function GridCell({ x, y, onPlace, isPlacing, isOccupied, isValidPlacement }: { 
  x: number; 
  y: number; 
  onPlace: (x: number, y: number) => void; 
  isPlacing: boolean;
  isOccupied?: boolean;
  isValidPlacement?: boolean;
}) {
  return (
    <motion.div 
      className={cn(
        "border border-purple-500/20 transition-all duration-200",
        isPlacing && "cursor-copy hover:bg-primary/30 hover:border-primary/50 hover:shadow-md",
        isOccupied && "bg-red-500/20 border-red-500/40",
        isPlacing && !isValidPlacement && "cursor-not-allowed bg-red-500/20 border-red-500/40"
      )}
      style={{
        gridColumnStart: x,
        gridRowStart: y,
      }}
      whileHover={isPlacing ? { scale: 1.05 } : {}}
      onClick={() => onPlace(x, y)}
    />
  );
}


export function FloorPlanCanvas({ 
  locationData, 
  initialRacks, 
  initialEndpoints = [], 
  tenantId, 
  isEditMode, 
  currentTheme = 'default', 
  showImageTools = false,
  onRacksUpdate,
  onEndpointsUpdate,
  onToggleImageTools
}: FloorPlanCanvasProps) {
  const [racks, setRacks] = useState(initialRacks);
  const [rackToPlaceId, setRackToPlaceId] = useState<string | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [selectedRackIds, setSelectedRackIds] = useState<string[]>([]);
  
  // Endpoint state
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [endpointToPlaceId, setEndpointToPlaceId] = useState<string | null>(null);
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>([]);
  const [selectedRackFilter, setSelectedRackFilter] = useState<string | undefined>();
  
  // Image tools state
  const [imageAdjustments, setImageAdjustments] = useState({
    opacity: 50,
    brightness: 100,
    contrast: 100,
    saturation: 0,
    rotation: 0,
    flipH: false,
    flipV: false
  });
  
  const [isPlacing, setIsPlacing] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  
  useEffect(() => {
    setRacks(initialRacks);
  }, [initialRacks]);

  useEffect(() => {
    setEndpoints(initialEndpoints);
  }, [initialEndpoints]);

  // When exiting edit mode, clear any selected rack/endpoint for placement
  useEffect(() => {
    if (!isEditMode) {
      setRackToPlaceId(null);
      setEndpointToPlaceId(null);
    }
  }, [isEditMode]);

  const handleRackSelect = (rackId: string) => {
    setSelectedRackId(prevId => prevId === rackId ? null : rackId);
  };

  const handleMultiRackSelect = (rackId: string) => {
    setSelectedRackIds(prev => 
      prev.includes(rackId) 
        ? prev.filter(id => id !== rackId)
        : [...prev, rackId]
    );
  };

  const handleMultiSelect = (rackIds: string[]) => {
    setSelectedRackIds(rackIds);
  };

  const handleClearSelection = () => {
    setSelectedRackIds([]);
    setSelectedRackId(null);
  };

  const handleSelectAllPlaced = () => {
    const allPlacedIds = placedRacks.map(rack => rack.id);
    setSelectedRackIds(allPlacedIds);
  };

  const handleDeleteSelected = async () => {
    if (selectedRackIds.length === 0) return;
    
    setIsPlacing(true);
    
    try {
      const { error } = await supabase
        .from('racks')
        .update({ pos_x: null, pos_y: null })
        .in('id', selectedRackIds);
        
      if (error) throw error;
      
      setSelectedRackIds([]);
      onRacksUpdate();
    } catch (error) {
      console.error('Error removing racks:', error);
      toast({ title: 'Error', description: 'No se pudieron mover los racks.', variant: 'destructive' });
    } finally {
      setIsPlacing(false);
    }
  };

  // Validation functions
  const isPositionOccupied = (x: number, y: number) => {
    return placedRacks.some(r => r.pos_x === x && r.pos_y === y);
  };

  const isValidRackPlacement = (x: number, y: number, rackId?: string) => {
    // Check if position is within grid bounds
    if (x < 1 || x > cols || y < 1 || y > rows) {
      return false;
    }

    // Check if position is occupied by another rack
    if (isPositionOccupied(x, y)) {
      return false;
    }

    // Add custom placement rules here
    // For example: check for minimum distance between racks
    const minDistance = 1; // Minimum distance between racks
    const tooClose = placedRacks.some(rack => {
      if (rackId && rack.id === rackId) return false; // Skip self when moving
      if (!rack.pos_x || !rack.pos_y) return false;
      
      const distance = Math.abs(rack.pos_x - x) + Math.abs(rack.pos_y - y);
      return distance < minDistance;
    });

    if (tooClose) {
      return false;
    }

    return true;
  };

  const validatePlacementWithFeedback = (x: number, y: number, rackId?: string) => {
    if (x < 1 || x > cols || y < 1 || y > rows) {
      toast({ 
        title: 'Posición inválida', 
        description: 'La posición está fuera de los límites del plano.', 
        variant: 'destructive' 
      });
      return false;
    }

    if (isPositionOccupied(x, y)) {
      toast({ 
        title: 'Celda Ocupada', 
        description: 'Ya existe un rack en esta posición.', 
        variant: 'destructive' 
      });
      return false;
    }

    // Check for proximity to other racks
    const minDistance = 1;
    const nearbyRack = placedRacks.find(rack => {
      if (rackId && rack.id === rackId) return false;
      if (!rack.pos_x || !rack.pos_y) return false;
      
      const distance = Math.abs(rack.pos_x - x) + Math.abs(rack.pos_y - y);
      return distance < minDistance;
    });

    if (nearbyRack) {
      toast({ 
        title: 'Demasiado cerca', 
        description: `El rack estaría muy cerca de "${nearbyRack.name}". Mantén una distancia mínima.`, 
        variant: 'destructive' 
      });
      return false;
    }

    return true;
  };

  const placedRacks = useMemo(() => racks.filter(r => r.pos_x && r.pos_y), [racks]);
  
  const unplacedRacks = useMemo(() => racks.filter(r => !r.pos_x || !r.pos_y), [racks]);

  const placedEndpoints = useMemo(() => endpoints.filter(e => e.pos_x && e.pos_y), [endpoints]);
  
  const unplacedEndpoints = useMemo(() => endpoints.filter(e => !e.pos_x || !e.pos_y), [endpoints]);

  // Performance monitoring
  const { isSlowDevice } = useDebouncedPerformance(rackToPlaceId, 300);

  const handleSelectRackToPlace = useCallback((rackId: string) => {
    setRackToPlaceId(prevId => prevId === rackId ? null : rackId);
  }, []);

  const throttledRackSelect = useThrottle((rackId: string) => {
    handleSelectRackToPlace(rackId);
  }, isSlowDevice ? 200 : 100);

  const handlePlaceRack = async (x: number, y: number) => {
    if (!rackToPlaceId || isPlacing) return;
    
    // Validate placement with user feedback
    if (!validatePlacementWithFeedback(x, y, rackToPlaceId)) {
      return;
    }
    
    setIsPlacing(true);
    
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
      toast({ 
        title: 'Rack Colocado', 
        description: `${rackName} ha sido posicionado correctamente en (${x}, ${y}).`,
        duration: 3000
      });
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

  const handleMoveRack = (rackId: string) => {
    setRackToPlaceId(rackId);
    toast({ 
      title: 'Modo Mover Activado', 
      description: 'Haz clic en una celda vacía para mover el rack a esa posición.',
      duration: 5000
    });
  };

  // Endpoint handlers
  const handleEndpointSelect = (endpointId: string) => {
    setSelectedEndpointIds(prev => 
      prev.includes(endpointId) 
        ? prev.filter(id => id !== endpointId)
        : [...prev, endpointId]
    );
  };

  const handleEndpointToPlace = (endpointId: string) => {
    setEndpointToPlaceId(prevId => prevId === endpointId ? null : endpointId);
  };

  const handlePlaceEndpoint = async (x: number, y: number) => {
    if (!endpointToPlaceId || isPlacing) return;
    
    // Check if position is occupied by a rack
    const isRackPosition = placedRacks.some(r => r.pos_x === x && r.pos_y === y);
    if (isRackPosition) {
      toast({ 
        title: 'Posición ocupada', 
        description: 'No se puede colocar un endpoint donde hay un rack.',
        variant: 'destructive' 
      });
      return;
    }
    
    setIsPlacing(true);
    
    const endpointName = endpoints.find(e => e.id === endpointToPlaceId)?.name || 'El endpoint';
    const placingId = endpointToPlaceId;
    setEndpointToPlaceId(null);

    // Since endpoints are assets, we need to update the assets table
    const { error } = await supabase
      .from('assets')
      .update({ 
        details: { pos_x: x, pos_y: y } // Store position in details JSON field
      })
      .eq('id', placingId);
      
    if (error) {
      toast({ title: 'Error al colocar el endpoint', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Endpoint Colocado', 
        description: `${endpointName} ha sido posicionado correctamente en (${x}, ${y}).`,
        duration: 3000
      });
      onEndpointsUpdate?.();
    }
    
    setIsPlacing(false);
  };

  const handleUnplaceEndpoint = async (endpointId: string) => {
    if (isPlacing) return;
    setIsPlacing(true);
    
    const { error } = await supabase
      .from('assets')
      .update({ 
        details: { pos_x: null, pos_y: null }
      })
      .eq('id', endpointId);
      
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Endpoint devuelto a la paleta.' });
      onEndpointsUpdate?.();
    }
    setIsPlacing(false);
  };

  const handleMoveEndpoint = (endpointId: string) => {
    setEndpointToPlaceId(endpointId);
    toast({ 
      title: 'Modo Mover Activado', 
      description: 'Haz clic en una celda vacía para mover el endpoint a esa posición.',
      duration: 5000
    });
  };

  // Combined placement handler
  const handlePlaceItem = async (x: number, y: number) => {
    if (rackToPlaceId) {
      await handlePlaceRack(x, y);
    } else if (endpointToPlaceId) {
      await handlePlaceEndpoint(x, y);
    }
  };

  // Generate dynamic image styles
  const getImageStyles = () => {
    const { opacity, brightness, contrast, saturation, rotation, flipH, flipV } = imageAdjustments;
    
    return {
      opacity: opacity / 100,
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${
        currentTheme === 'negative' ? 'invert(1)' : ''
      } ${currentTheme === 'grayscale' || currentTheme === 'negative' ? 'grayscale(1)' : ''}`,
      transform: `rotate(${rotation}deg) ${flipH ? 'scaleX(-1)' : ''} ${flipV ? 'scaleY(-1)' : ''}`,
    };
  };

  if (!locationData.grid_columns || !locationData.grid_rows) {
      return <div>Error: Grid dimensions not set for this location.</div>
  }

  const cols = locationData.grid_columns;
  const rows = locationData.grid_rows;

  return (
      <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
        {/* Keyboard Shortcuts */}
        <FloorPlanKeyboardShortcuts
          isEditMode={isEditMode}
          selectedRacks={selectedRackIds}
          onDeleteSelected={handleDeleteSelected}
          onSelectAll={handleSelectAllPlaced}
          onDeselectAll={handleClearSelection}
          onToggleEditMode={() => {}}
        />
        <motion.div 
          className={cn(
            "relative w-full rounded-lg overflow-hidden glassmorphic-card flex-grow transition-all duration-300",
            "aspect-video md:aspect-[4/3] lg:aspect-video",
            (rackToPlaceId || endpointToPlaceId) && isEditMode && 'cursor-copy ring-2 ring-primary/30'
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FloorPlanZoom disabled={false} showControls={true}>
            {/* Image Tools */}
            <FloorPlanImageTools
              onAdjustmentsChange={setImageAdjustments}
              isVisible={isEditMode && showImageTools}
            />
            
            <OptimizedFloorPlanImage
              src={locationData.floor_plan_image_url || ''}
              alt={`Plano de planta de ${locationData.name}`}
              className={cn(
                "absolute inset-0 object-cover",
                getImageTransitionClasses()
              )}
              style={getImageStyles()}
              containerWidth={800}
              containerHeight={600}
              priority={true}
            />
            
            <div
                className="absolute inset-0 w-full h-full grid gap-0.5 md:gap-1"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
            >
                {/* Grid cells for editing */}
                {(isEditMode || !!rackToPlaceId) && Array.from({ length: cols * rows }).map((_, index) => {
                    const x = (index % cols) + 1;
                    const y = Math.floor(index / cols) + 1;
                    const isOccupied = isPositionOccupied(x, y);
                    const isValidPlacement = rackToPlaceId ? isValidRackPlacement(x, y, rackToPlaceId) : true;
                    
                    return (
                      <GridCell 
                        key={`cell-${x}-${y}`} 
                        x={x} 
                        y={y} 
                        onPlace={handlePlaceItem} 
                        isPlacing={!!rackToPlaceId || !!endpointToPlaceId}
                        isOccupied={isOccupied}
                        isValidPlacement={isValidPlacement}
                      />
                    );
                })}

                {/* Always render placed racks with higher z-index */}
                {placedRacks.map(rack => (
                  <RackItem 
                    key={rack.id} 
                    rack={rack} 
                    isEditMode={isEditMode} 
                    isSelected={selectedRackId === rack.id || selectedRackIds.includes(rack.id)}
                    currentTheme={currentTheme}
                    onUnplace={handleUnplaceRack}
                    onSelect={isEditMode ? handleMultiRackSelect : handleRackSelect}
                    onMove={handleMoveRack}
                  />
                ))}

                {/* Render placed endpoints */}
                {placedEndpoints.map(endpoint => (
                  <EndpointItem
                    key={endpoint.id} 
                    endpoint={endpoint} 
                    isEditMode={isEditMode} 
                    isSelected={selectedEndpointIds.includes(endpoint.id)}
                    onUnplace={handleUnplaceEndpoint}
                    onSelect={handleEndpointSelect}
                    onMove={handleMoveEndpoint}
                  />
                ))}
            </div>
          </FloorPlanZoom>
        </motion.div>

        {/* Sidebar for Edit Mode or Search */}
        <AnimatePresence>
          {isEditMode ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Unplaced Racks */}
              <div className="space-y-4">
                <Card className="glassmorphic-card w-full lg:w-64 xl:w-72">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">Racks sin Colocar</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Selecciona un rack y haz clic en una celda vacía para colocarlo.</CardDescription>
                    <CardDescription className="text-xs sm:hidden">Toca un rack y luego una celda vacía.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <AnimatePresence>
                      {isPlacing && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex justify-center"
                        >
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {unplacedRacks.length > 0 ? (
                      <motion.div layout className="space-y-2">
                        <AnimatePresence>
                          {unplacedRacks.map(rack => (
                            <motion.div
                              key={rack.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              layout
                            >
                              <UnplacedRackItem 
                                rack={rack}
                                onClick={() => throttledRackSelect(rack.id)}
                                isSelected={rack.id === rackToPlaceId}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    ) : (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-400 text-center py-4"
                      >
                        Todos los racks están en el plano.
                      </motion.p>
                    )}
                  </CardContent>
                </Card>

                <EndpointFilter
                  endpoints={endpoints}
                  racks={racks}
                  selectedEndpoints={selectedEndpointIds}
                  selectedRackFilter={selectedRackFilter}
                  endpointToPlace={endpointToPlaceId}
                  onEndpointSelect={handleEndpointSelect}
                  onRackFilterChange={setSelectedRackFilter}
                  onEndpointToPlace={handleEndpointToPlace}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full lg:w-64 xl:w-72 order-first lg:order-last"
            >
              <RackSearchFilter
                racks={racks}
                selectedRacks={selectedRackIds}
                onRackSelect={handleMultiRackSelect}
                onMultiSelect={handleMultiSelect}
                onClearSelection={handleClearSelection}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rack Info Panel */}
        <AnimatePresence>
          {selectedRackId && !isEditMode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full xl:w-80 order-last"
            >
              <RackInfoPanel 
                rackId={selectedRackId} 
                onClose={() => setSelectedRackId(null)} 
              />
            </motion.div>
          )}
        </AnimatePresence>

       <AnimatePresence>
         {!isEditMode && unplacedRacks.length > 0 && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="flex items-center gap-2 text-xs text-amber-400 mt-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/20"
           >
              <AlertTriangle className="h-4 w-4"/>
              Hay {unplacedRacks.length} rack(s) sin posición asignada. Activa el "Modo Edición" para colocarlos en el plano.
          </motion.div>
         )}
       </AnimatePresence>

       <AnimatePresence>
         {!isEditMode && !!rackToPlaceId && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="flex items-center gap-2 text-xs text-blue-400 mt-4 p-3 rounded-md bg-blue-500/10 border border-blue-500/20"
           >
              <Move3D className="h-4 w-4"/>
              Modo Mover: Haz clic en una celda vacía para mover el rack "{racks.find(r => r.id === rackToPlaceId)?.name}".
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRackToPlaceId(null)}
                className="ml-auto"
              >
                Cancelar
              </Button>
          </motion.div>
         )}
       </AnimatePresence>

       <AnimatePresence>
         {!isEditMode && !!endpointToPlaceId && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -20 }}
             className="flex items-center gap-2 text-xs text-green-400 mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/20"
           >
              <Move3D className="h-4 w-4"/>
              Modo Mover: Haz clic en una celda vacía para mover el endpoint "{endpoints.find(e => e.id === endpointToPlaceId)?.name}".
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEndpointToPlaceId(null)}
                className="ml-auto"
              >
                Cancelar
              </Button>
          </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
