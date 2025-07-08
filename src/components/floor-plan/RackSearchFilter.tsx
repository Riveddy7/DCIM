'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Hash, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Rack {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  total_u: number;
}

interface RackSearchFilterProps {
  racks: Rack[];
  selectedRacks: string[];
  onRackSelect: (rackId: string) => void;
  onMultiSelect: (rackIds: string[]) => void;
  onClearSelection: () => void;
}

export function RackSearchFilter({ 
  racks, 
  selectedRacks, 
  onRackSelect, 
  onMultiSelect, 
  onClearSelection 
}: RackSearchFilterProps) {
  const sortedRacks = useMemo(() => {
    return [...racks].sort((a, b) => a.name.localeCompare(b.name));
  }, [racks]);

  const selectedRack = useMemo(() => {
    return selectedRacks.length === 1 ? racks.find(r => r.id === selectedRacks[0]) : null;
  }, [selectedRacks, racks]);

  const getPositionText = (rack: Rack) => {
    return rack.pos_x !== null && rack.pos_y !== null 
      ? `Posición: (${rack.pos_x}, ${rack.pos_y})`
      : 'Sin posición asignada';
  };

  return (
    <Card className="glassmorphic-card border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline text-lg text-purple-200 flex items-center gap-2">
          <Server className="h-5 w-5" />
          Filtros de Racks
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Rack Filter Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {sortedRacks.map((rack) => (
                <motion.div
                  key={rack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Button
                    variant={selectedRacks.includes(rack.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => onRackSelect(rack.id)}
                    className={cn(
                      "w-full justify-start text-left h-auto py-2 px-3",
                      selectedRacks.includes(rack.id)
                        ? "bg-purple-500/20 border-purple-400/50 text-purple-200"
                        : "bg-gray-800/50 border-gray-700/50 hover:border-purple-500/30 text-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Server className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate font-medium">{rack.name}</span>
                      {rack.pos_x && rack.pos_y && (
                        <Badge 
                          variant="outline" 
                          className="ml-auto border-green-500/50 text-green-400 text-xs"
                        >
                          Colocado
                        </Badge>
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Selected Rack Details */}
        <AnimatePresence>
          {selectedRack && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <Server className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-purple-200">{selectedRack.name}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span>Tamaño: {selectedRack.total_u}U</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{getPositionText(selectedRack)}</span>
                </div>
              </div>
              
              {selectedRack.pos_x && selectedRack.pos_y ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  Rack colocado en el plano
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                  Rack sin colocar
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}