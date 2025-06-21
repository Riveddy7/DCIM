
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Power, Info, ListTree, PackagePlus, Cable, CirclePlus, GitCommitHorizontal, Trash2 } from 'lucide-react';
import type { AssetWithPorts, Json, PortDetails } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { CreateAssetForm } from './CreateAssetForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { BulkPortGeneratorForm } from '../ports/BulkPortGeneratorForm';
import { ConnectPortDialog } from '../ports/ConnectPortDialog';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface AssetDetailPanelProps {
  asset: AssetWithPorts | null;
  rackAssets: AssetWithPorts[];
  tenantId: string;
  rackId: string;
  rackLocationId: string;
  addingAssetSlot: number | null;
  onAssetCreateSuccess: () => void;
  onCancelAddAsset: () => void;
}

const formatKey = (key: string): string => {
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
          <span className="text-gray-200 text-right break-all">{String(value)}</span>
        </li>
      ))}
    </ul>
  );
};

export function AssetDetailPanel({ asset, rackAssets, tenantId, rackId, rackLocationId, addingAssetSlot, onAssetCreateSuccess, onCancelAddAsset }: AssetDetailPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [portToConnect, setPortToConnect] = useState<PortDetails | null>(null);
  
  const assetsInSameRack = asset ? rackAssets.filter(a => a.id !== asset.id) : [];

  const handleDisconnect = async (port: PortDetails) => {
    const connection = port.connections_port_a[0] || port.connections_port_b[0];
    if (!connection) return;

    const { error } = await supabase.from('connections').delete().match({ id: connection.id });

    if (error) {
      toast({ title: 'Error', description: `No se pudo desconectar el puerto: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: 'Puerto desconectado correctamente.' });
      router.refresh();
    }
  };
  
  if (addingAssetSlot !== null) {
    return (
      <Card className="glassmorphic-card h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="font-headline text-2xl text-gray-50 flex items-center">
            <PackagePlus className="mr-3 h-6 w-6 text-primary" />
            Añadir Nuevo Activo en U: {addingAssetSlot}
          </CardTitle>
          <CardDescription className="text-gray-400">Completa los detalles para el nuevo activo.</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow">
          <CardContent className="pt-0">
            <CreateAssetForm tenantId={tenantId} rackId={rackId} rackLocationId={rackLocationId} startU={addingAssetSlot} onAssetCreateSuccess={onAssetCreateSuccess} onCancel={onCancelAddAsset} />
          </CardContent>
        </ScrollArea>
      </Card>
    );
  }

  if (!asset) {
    return (
      <Card className="glassmorphic-card h-full flex flex-col items-center justify-center">
        <CardContent className="text-center">
          <Server className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <p className="text-gray-400">Selecciona un activo del rack</p>
          <p className="text-sm text-gray-500">o un espacio vacío para añadir uno nuevo.</p>
        </CardContent>
      </Card>
    );
  }

  const statusText = asset.status || 'Desconocido';
  const statusColor =
    statusText.toLowerCase() === 'in_production' ? 'bg-green-500/80 text-green-50' :
    statusText.toLowerCase() === 'in_storage' ? 'bg-yellow-500/80 text-yellow-50' :
    statusText.toLowerCase() === 'offline' ? 'bg-red-500/80 text-red-50' :
    statusText.toLowerCase() === 'maintenance' ? 'bg-orange-500/80 text-orange-50' :
    'bg-gray-500/80 text-gray-50';

  const assetPorts: PortDetails[] = Array.isArray(asset.ports) ? asset.ports : [];

  return (
    <>
      <Card className="glassmorphic-card h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-2xl text-gray-50 flex items-center">
              <Server className="mr-3 h-6 w-6 text-primary" />
              {asset.name || 'Activo Sin Nombre'}
            </CardTitle>
            <Badge className={cn("text-xs", statusColor)}>{statusText}</Badge>
          </div>
          <CardDescription className="text-gray-400">{asset.asset_type || 'Tipo no especificado'}</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow">
          <CardContent className="pt-0 space-y-6">
            <div>
              <h4 className="font-semibold text-gray-300 mb-2 flex items-center"><Info className="mr-2 h-4 w-4 text-sky-400" />Información General</h4>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between"><span className="text-gray-400">ID:</span> <span className="text-gray-200 font-mono text-xs">{asset.id}</span></li>
                <li className="flex justify-between"><span className="text-gray-400">Unidad de Inicio (U):</span> <span className="text-gray-200">{asset.start_u ?? 'N/A'}</span></li>
                <li className="flex justify-between"><span className="text-gray-400">Tamaño (U):</span> <span className="text-gray-200">{asset.size_u ?? 'N/A'}</span></li>
              </ul>
            </div>

            {asset.details && Object.keys(asset.details).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-300 mb-2 flex items-center"><ListTree className="mr-2 h-4 w-4 text-lime-400" />Detalles Específicos</h4>
                {renderJsonDetails(asset.details)}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-300 flex items-center"><Power className="mr-2 h-4 w-4 text-rose-400" />Puertos ({assetPorts.length || 0})</h4>
                <div className="flex gap-2">
                  <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><GitCommitHorizontal className="mr-2 h-4 w-4" />Generar en Lote</Button>
                    </DialogTrigger>
                    <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50">
                      <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Generar Puertos en Lote</DialogTitle>
                        <DialogDescription>Crea múltiples puertos con un prefijo y numeración secuencial.</DialogDescription>
                      </DialogHeader>
                      <BulkPortGeneratorForm assetId={asset.id} tenantId={tenantId} onSuccess={() => { setIsBulkDialogOpen(false); router.refresh(); }} />
                    </DialogContent>
                  </Dialog>
                  {/* Placeholder for single port add */}
                  <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"><CirclePlus className="mr-2 h-4 w-4" />Añadir Puerto</Button>
                </div>
              </div>
              
              {assetPorts.length > 0 ? (
                <ul className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
                  {assetPorts.map(port => {
                    const isConnected = port.connections_port_a.length > 0 || port.connections_port_b.length > 0;
                    return (
                      <li key={port.id} className="p-2 bg-gray-800/30 rounded-md border border-purple-500/20 flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", isConnected ? 'bg-green-500' : 'bg-gray-500')} title={isConnected ? 'Conectado' : 'Libre'}></div>
                          <div>
                            <span className="text-gray-200 font-medium">{port.name || 'Puerto sin nombre'}</span>
                            <Badge variant="outline" className="ml-2 text-xs border-cyan-500/50 text-cyan-300">{port.port_type || 'N/A'}</Badge>
                          </div>
                        </div>
                        {isConnected ? (
                          <Button variant="destructive" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDisconnect(port)}><Trash2 className="mr-2 h-4 w-4"/>Desconectar</Button>
                        ) : (
                          <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setPortToConnect(port); setIsConnectDialogOpen(true); }}><Cable className="mr-2 h-4 w-4"/>Conectar</Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Este activo no tiene puertos registrados.</p>
              )}
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
      
      {portToConnect && (
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50 sm:max-w-4xl">
             <ConnectPortDialog 
                portA={portToConnect}
                tenantId={tenantId}
                assetsInSameRack={assetsInSameRack}
                onSuccess={() => { setIsConnectDialogOpen(false); setPortToConnect(null); router.refresh(); }}
                onCancel={() => { setIsConnectDialogOpen(false); setPortToConnect(null); }}
             />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
