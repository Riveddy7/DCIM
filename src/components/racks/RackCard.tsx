

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress }
from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Network } from 'lucide-react'; 
import type { Database } from '@/lib/database.types';

type RackOverview = Database['public']['Functions']['get_racks_overview']['Returns'][number];

interface RackCardProps {
  rack: RackOverview;
}

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'online':
      return 'bg-green-500';
    case 'offline':
      return 'bg-red-500';
    case 'maintenance':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export function RackCard({ rack }: RackCardProps) {
  const occupiedU = rack.occupied_u || 0;
  const totalU = rack.total_u || 1; 
  const uOccupancyPercentage = totalU > 0 ? Math.round((occupiedU / totalU) * 100) : 0;

  const usedPorts = rack.used_rack_ports || 0;
  const totalPorts = rack.total_rack_ports || 0;
  const portAvailabilityPercentage = totalPorts > 0 ? Math.round((usedPorts / totalPorts) * 100) : 0;
  const availablePorts = totalPorts - usedPorts;

  return (
    <Link href={`/racks/${rack.id}`} className="block group">
      <Card className="glassmorphic-card hover:border-purple-400/70 transition-all duration-300 ease-in-out">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`block h-3 w-3 rounded-full ${getStatusColor(rack.status)}`} title={rack.status || 'Unknown Status'}></span>
              <CardTitle className="font-headline text-xl text-gray-50 group-hover:text-primary transition-colors">
                {rack.name || 'Unnamed Rack'}
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
              {rack.location_name || 'N/A'} {/* Changed from rack.location */}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 pt-1">{rack.description || 'No description available.'}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center text-xs text-gray-400 gap-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>{rack.asset_count || 0} Assets</span>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-300">U Occupancy</span>
              <span className="text-xs text-purple-300">{occupiedU} / {totalU} U ({uOccupancyPercentage}%)</span>
            </div>
            <Progress value={uOccupancyPercentage} className="h-2 [&>div]:bg-primary neon-glow-primary" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-300">Port Availability</span>
              <span className="text-xs text-teal-300">{usedPorts} Used / {availablePorts < 0 ? 0 : availablePorts} Free ({totalPorts} Total)</span>
            </div>
            <Progress value={portAvailabilityPercentage} className="h-2 [&>div]:bg-teal-500 neon-glow-secondary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

    