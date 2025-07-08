'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Server, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnplacedEndpointItem } from './UnplacedEndpointItem';

interface Endpoint {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  rack_id?: string | null;
  asset_type: string;
  status: string;
}

interface Rack {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  total_u: number;
}

interface EndpointFilterProps {
  endpoints: Endpoint[];
  racks: Rack[];
  selectedEndpoints: string[];
  selectedRackFilter?: string;
  endpointToPlace?: string | null;
  onEndpointSelect: (endpointId: string) => void;
  onRackFilterChange: (rackId: string | undefined) => void;
  onEndpointToPlace: (endpointId: string) => void;
}

export function EndpointFilter({ 
  endpoints,
  racks,
  selectedEndpoints,
  selectedRackFilter,
  endpointToPlace,
  onEndpointSelect,
  onRackFilterChange,
  onEndpointToPlace
}: EndpointFilterProps) {
  const [showAll, setShowAll] = useState(false);

  // Get unplaced endpoints
  const unplacedEndpoints = useMemo(() => {
    return endpoints.filter(endpoint => !endpoint.pos_x || !endpoint.pos_y);
  }, [endpoints]);

  // Filter endpoints by selected rack
  const filteredEndpoints = useMemo(() => {
    if (!selectedRackFilter || selectedRackFilter === 'all') {
      return unplacedEndpoints;
    }
    
    // For now, return all unplaced endpoints since we don't have rack assignment yet
    // This would be filtered by rack_id when the relationship is established
    return unplacedEndpoints;
  }, [unplacedEndpoints, selectedRackFilter]);

  // Get visible endpoints (limited or all)
  const visibleEndpoints = useMemo(() => {
    if (showAll) return filteredEndpoints;
    return filteredEndpoints.slice(0, 5);
  }, [filteredEndpoints, showAll]);

  // Get rack name by ID
  const getRackName = (rackId: string) => {
    const rack = racks.find(r => r.id === rackId);
    return rack?.name || 'Rack desconocido';
  };

  const placedRacks = racks.filter(r => r.pos_x && r.pos_y);

  return (
    <Card className="glassmorphic-card border-blue-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline text-lg text-blue-200 flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Endpoints
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Rack Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Filter className="h-4 w-4" />
            <span>Filtrar por Rack</span>
          </div>
          <Select 
            value={selectedRackFilter || 'all'} 
            onValueChange={(value) => onRackFilterChange(value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="bg-input border-blue-500/30 text-gray-300">
              <SelectValue placeholder="Todos los racks" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-blue-500/50 text-gray-200">
              <SelectItem value="all">Todos los racks</SelectItem>
              {placedRacks.map((rack) => (
                <SelectItem key={rack.id} value={rack.id}>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    {rack.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Endpoints List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">
              Endpoints sin colocar ({filteredEndpoints.length})
            </span>
            {filteredEndpoints.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-blue-400 hover:text-blue-300 h-auto p-1"
              >
                {showAll ? 'Mostrar menos' : `Ver todos (${filteredEndpoints.length})`}
              </Button>
            )}
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-1">
            <AnimatePresence>
              {visibleEndpoints.map((endpoint) => (
                <motion.div
                  key={endpoint.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <UnplacedEndpointItem
                    endpoint={endpoint}
                    isSelected={endpoint.id === endpointToPlace}
                    onClick={() => onEndpointToPlace(endpoint.id)}
                    rackName={endpoint.rack_id ? getRackName(endpoint.rack_id) : undefined}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredEndpoints.length === 0 && (
              <div className="text-center py-6">
                <Wifi className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-400">
                  {selectedRackFilter && selectedRackFilter !== 'all' 
                    ? 'No hay endpoints sin colocar para este rack'
                    : 'No hay endpoints sin colocar'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Info */}
        {selectedRackFilter && selectedRackFilter !== 'all' && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-blue-200">
                {getRackName(selectedRackFilter)}
              </span>
            </div>
            <div className="text-sm text-gray-300">
              Mostrando endpoints para este rack
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}