
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Power, Info, ListTree } from 'lucide-react';
import type { AssetWithPorts, Json } from '@/lib/database.types';

interface AssetDetailPanelProps {
  asset: AssetWithPorts | null;
}

// Helper function to format keys (e.g., 'serial_number' to 'Serial Number')
const formatKey = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const renderJsonDetails = (details: Json | undefined | null): React.ReactNode => {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return <p className="text-sm text-gray-500">No hay detalles adicionales disponibles.</p>;
  }

  const entries = Object.entries(details);
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">No hay detalles adicionales disponibles.</p>;
  }

  return (
    <ul className="space-y-1 text-sm">
      {entries.map(([key, value]) => (
        <li key={key} className="flex justify-between">
          <span className="text-gray-400">{formatKey(key)}:</span>
          <span className="text-gray-200 text-right">{String(value)}</span>
        </li>
      ))}
    </ul>
  );
};

export function AssetDetailPanel({ asset }: AssetDetailPanelProps) {
  if (!asset) {
    return (
      <Card className="glassmorphic-card h-full flex flex-col items-center justify-center">
        <CardContent className="text-center">
          <Server className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <p className="text-gray-400">Selecciona un activo del rack</p>
          <p className="text-sm text-gray-500">para ver sus detalles aquí.</p>
        </CardContent>
      </Card>
    );
  }

  const statusColor = asset.status === 'Online' ? 'bg-green-500/80 text-green-50' :
                      asset.status === 'Offline' ? 'bg-red-500/80 text-red-50' :
                      asset.status === 'Maintenance' ? 'bg-yellow-500/80 text-yellow-50' :
                      'bg-gray-500/80 text-gray-50';

  return (
    <Card className="glassmorphic-card h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-2xl text-gray-50 flex items-center">
            <Server className="mr-3 h-6 w-6 text-primary" />
            {asset.name || 'Activo Sin Nombre'}
          </CardTitle>
          <Badge className={cn("text-xs", statusColor)}>{asset.status || 'Desconocido'}</Badge>
        </div>
        <CardDescription className="text-gray-400">{asset.asset_type || 'Tipo no especificado'}</CardDescription>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="pt-0 space-y-6">
          <div>
            <h4 className="font-semibold text-gray-300 mb-2 flex items-center">
              <Info className="mr-2 h-4 w-4 text-sky-400"/>
              Información General
            </h4>
            <ul className="space-y-1 text-sm">
              <li className="flex justify-between"><span className="text-gray-400">ID:</span> <span className="text-gray-200 font-mono text-xs">{asset.id}</span></li>
              <li className="flex justify-between"><span className="text-gray-400">Unidad de Inicio (U):</span> <span className="text-gray-200">{asset.start_u ?? 'N/A'}</span></li>
              <li className="flex justify-between"><span className="text-gray-400">Tamaño (U):</span> <span className="text-gray-200">{asset.size_u ?? 'N/A'}</span></li>
            </ul>
          </div>

          {asset.details && (
            <div>
              <h4 className="font-semibold text-gray-300 mb-2 flex items-center">
                <ListTree className="mr-2 h-4 w-4 text-lime-400"/>
                Detalles Específicos
              </h4>
              {renderJsonDetails(asset.details)}
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-300 mb-2 flex items-center">
              <Power className="mr-2 h-4 w-4 text-rose-400"/>
              Puertos ({asset.ports?.length || 0})
            </h4>
            {asset.ports && asset.ports.length > 0 ? (
              <ul className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
                {asset.ports.map(port => (
                  <li key={port.id} className="p-2 bg-gray-800/30 rounded-md border border-purple-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-200 font-medium">{port.name || 'Puerto sin nombre'}</span>
                      <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-300">{port.port_type || 'N/A'}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{port.id}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Este activo no tiene puertos registrados.</p>
            )}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

// Helper cn function if not globally available (though it should be via @/lib/utils)
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
