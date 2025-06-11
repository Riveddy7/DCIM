
'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NetworkPortsProgressCardProps {
  totalPorts: number;
  usedPorts: number;
  className?: string;
}

export function NetworkPortsProgressCard({ totalPorts, usedPorts, className }: NetworkPortsProgressCardProps) {
  const availablePorts = totalPorts - usedPorts;
  const usagePercentage = totalPorts > 0 ? Math.round((usedPorts / totalPorts) * 100) : 0;

  return (
    <Card className={cn("glassmorphic-card h-full flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="font-headline text-xl text-gray-50">Puertos de Red (Disponibilidad)</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-center">
        <div className="space-y-1 mb-3">
          <p className="text-sm text-gray-300">Puertos Usados: <span className="font-semibold text-gray-50">{usedPorts}</span></p>
          <p className="text-sm text-gray-300">Puertos Disponibles: <span className="font-semibold text-gray-50">{availablePorts}</span></p>
        </div>
        <Progress value={usagePercentage} className="h-3 w-full [&>div]:bg-primary neon-glow-primary" aria-label={`${usagePercentage}% de puertos usados`} />
        <p className="text-xs text-gray-400 mt-2 text-right">Total: {totalPorts} Puertos</p>
      </CardContent>
    </Card>
  );
}

    