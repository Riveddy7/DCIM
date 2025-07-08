'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wifi } from 'lucide-react';
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

interface UnplacedEndpointItemProps {
  endpoint: Endpoint;
  isSelected: boolean;
  onClick: () => void;
  rackName?: string;
}

export function UnplacedEndpointItem({ endpoint, isSelected, onClick, rackName }: UnplacedEndpointItemProps) {
  const getStatusColor = () => {
    switch (endpoint.status) {
      case 'IN_PRODUCTION':
        return 'border-green-500/50 text-green-400';
      case 'PLANNED':
        return 'border-blue-500/50 text-blue-400';
      case 'INACTIVE':
        return 'border-gray-500/50 text-gray-400';
      default:
        return 'border-amber-500/50 text-amber-400';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant={isSelected ? "default" : "outline"}
        onClick={onClick}
        className={cn(
          "w-full justify-start h-auto p-3 text-left transition-all duration-200",
          isSelected
            ? "bg-purple-500/20 border-purple-400/50 text-purple-200 shadow-lg"
            : "bg-gray-800/50 border-gray-700/50 hover:border-purple-500/30 text-gray-300"
        )}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Wifi className="h-3 w-3 text-blue-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">{endpoint.name}</span>
              <Badge 
                variant="outline" 
                className={cn("text-xs", getStatusColor())}
              >
                {endpoint.status}
              </Badge>
            </div>
            {rackName && (
              <div className="text-xs text-gray-400">
                Rack: {rackName}
              </div>
            )}
            <div className="text-xs text-gray-500">
              Endpoint de usuario
            </div>
          </div>
        </div>
      </Button>
    </motion.div>
  );
}