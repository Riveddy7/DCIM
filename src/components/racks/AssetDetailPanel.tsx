
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Power, Info, ListTree, PackagePlus, Cable, CirclePlus, GitCommitHorizontal, Trash2, ArrowRight, Network, Rows3, Columns3 } from 'lucide-react';
import type { AssetWithPorts, Json, PortDetails, PortConnectionInfo } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { CreateAssetForm } from './CreateAssetForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

const CableDetailsTooltip = ({ connection }: { connection: PortConnectionInfo }) => {
  if (!connection.details || typeof connection.details !== 'object' || Array.isArray(connection.details)) {
    return null;
  }
  const details = connection.details as Record<string, any>;
  const entries = Object.entries(details).filter(([, value]) => value !== null && value !== undefined && value !== '');

  if (entries.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-400 hover:bg-amber-400/10">
            <Cable className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-popover text-popover-foreground">
          <p className="font-bold mb-2">Detalles del Cable</p>
          <ul className="space-y-1">
            {entries.map(([key, value]) => (
              <li key={key} className="flex justify-between text-xs gap-4">
                <span className="text-gray-400">{formatKey(key)}:</span>
                <span className="text-gray-200">{String(value)}</span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function AssetDetailPanel({ asset, rackAssets, tenantId, rackId, rackLocationId, addingAssetSlot, onAssetCreateSuccess, onCancelAddAsset }: AssetDetailPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [portToConnect, setPortToConnect] = useState<PortDetails | null>(null);
  const [connectionMode, setConnectionMode] = useState<'standard' | 'endpoint'>('standard');
  const [patchPanelView, setPatchPanelView] = useState<'front' | 'rear'>('front');

  const assetsInSameRack = asset ? rackAssets.filter(a => a.id !== asset.id) : [];

  const handleDisconnect = async (portId: string) => {
    // Find the full port object to get connection info
    const port = asset?.ports.find(p => p.id === portId);
    if (!port) return;

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

  const findRemoteConnectionInfo = (connection: PortConnectionInfo) => {
    const remotePortId = connection.port_a_id === portToConnect?.id ? connection.port_b_id : connection.port_a_id;
    for (const remoteAsset of rackAssets) {
      for (const remotePort of remoteAsset.ports) {
        if (remotePort.id === remotePortId) {
          return { asset: remoteAsset, port: remotePort };
        }
      }
    }
    // Fallback search if the asset is not in the same rack (e.g., endpoint)
    // This part would require a broader data fetch, so for now we'll return a placeholder
    return { asset: { name: 'External Asset' }, port: { name: 'Remote Port' } };
  };

  const groupedPorts = useMemo(() => {
    if (asset?.asset_type !== 'PATCH_PANEL' || !asset.ports) return null;
    const groups: Record<string, { front?: PortDetails; rear?: PortDetails }> = {};
    
    for (const port of asset.ports) {
      const baseName = port.name?.replace(/-[FR]$/, '');
      if (!baseName) continue;
      
      if (!groups[baseName]) {
        groups[baseName] = {};
      }

      if (port.name?.endsWith('-F')) {
        groups[baseName].front = port;
      } else if (port.name?.endsWith('-R')) {
        groups[baseName].rear = port;
      }
    }
    
    return Object.entries(groups).sort(([a], [b]) => {
        const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
        const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
        return numA - numB;
    });
  }, [asset]);


  if (addingAssetSlot !== null) {
    return (
      <Card className="glassmorphic-card-static h-full flex flex-col">
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
  
  const PortStatusIndicator = ({ port, isPatchPanelRear = false }: { port?: PortDetails, isPatchPanelRear?: boolean }) => {
    if (!port) return <div className="w-10 text-center text-gray-600">-</div>;
    const isConnected = (port.connections_port_a?.length || 0) > 0 || (port.connections_port_b?.length || 0) > 0;
    const iconColor = isConnected ? (isPatchPanelRear ? "text-cyan-400" : "text-green-400") : "text-gray-500";
    return <Network className={`h-4 w-4 ${iconColor}`} />;
  };

  return (
    <>
      <Card className="glassmorphic-card-static h-full flex flex-col">
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
                <div className="flex items-center gap-2">
                  {asset.asset_type === 'PATCH_PANEL' && (
                     <ToggleGroup type="single" value={patchPanelView} onValueChange={(value) => { if (value) setPatchPanelView(value as 'front' | 'rear'); }} className="h-8">
                       <ToggleGroupItem value="front" aria-label="Front view" className="px-2 h-full"><Columns3 className="h-4 w-4 mr-2"/>Frontal</ToggleGroupItem>
                       <ToggleGroupItem value="rear" aria-label="Rear view" className="px-2 h-full"><Rows3 className="h-4 w-4 mr-2"/>Trasera</ToggleGroupItem>
                     </ToggleGroup>
                  )}
                  <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><GitCommitHorizontal className="mr-2 h-4 w-4" />Generar en Lote</Button>
                    </DialogTrigger>
                    <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50">
                      <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">Generar Puertos en Lote</DialogTitle>
                        <DialogDescription>Crea múltiples puertos con un prefijo y numeración secuencial.</DialogDescription>
                      </DialogHeader>
                      <BulkPortGeneratorForm assetId={asset.id} assetType={asset.asset_type} tenantId={tenantId} onSuccess={() => { setIsBulkDialogOpen(false); router.refresh(); }} />
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"><CirclePlus className="mr-2 h-4 w-4" />Añadir Puerto</Button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm max-h-60 overflow-y-auto pr-2">
                {asset.asset_type === 'PATCH_PANEL' && groupedPorts ? (
                  // PATCH PANEL VIEW
                  <ul>
                    <li className="p-2 flex justify-between items-center text-xs text-gray-400 font-bold">
                       <div className="flex items-center gap-3 w-1/3">Puerto</div>
                       <div className="flex items-center justify-around w-1/3">
                         <div>Frontal</div>
                         <div>Trasero</div>
                       </div>
                       <div className="w-1/3 text-right">Acción</div>
                    </li>
                    {groupedPorts.map(([baseName, ports]) => {
                      const portToUse = patchPanelView === 'front' ? ports.front : ports.rear;
                      const isConnected = !!(portToUse && (portToUse.connections_port_a?.length > 0 || portToUse.connections_port_b?.length > 0));
                      return (
                        <li key={baseName} className="p-2 bg-gray-800/30 rounded-md border border-purple-500/20 flex justify-between items-center group">
                           <div className="flex items-center gap-3 w-1/3">
                             <span className="font-mono text-gray-200">{baseName}</span>
                           </div>
                           <div className="flex items-center justify-around w-1/3">
                              <PortStatusIndicator port={ports.front} />
                              <PortStatusIndicator port={ports.rear} isPatchPanelRear />
                           </div>
                           <div className="w-1/3 text-right">
                            {isConnected && portToUse ? (
                               <Button variant="ghost" size="sm" className="text-gray-500 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDisconnect(portToUse.id)}>
                                 <Trash2 className="mr-2 h-4 w-4"/> Desconectar
                               </Button>
                            ) : (
                               <Button variant="ghost" size="sm" className="text-gray-400 hover:text-primary hover:bg-primary/10" disabled={!portToUse} onClick={() => {
                                 if (!portToUse) return;
                                 setPortToConnect(portToUse);
                                 setConnectionMode(patchPanelView === 'rear' ? 'endpoint' : 'standard');
                                 setIsConnectDialogOpen(true);
                               }}>
                                 <Cable className="mr-2 h-4 w-4"/> Conectar
                               </Button>
                            )}
                           </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  // STANDARD ASSET VIEW
                  <ul>
                    {assetPorts.map(port => {
                      const connection = port.connections_port_a[0] || port.connections_port_b[0];
                      const isConnected = !!connection;
                      return (
                        <li key={port.id} className="p-2 bg-gray-800/30 rounded-md border border-purple-500/20 flex justify-between items-center group">
                          <div className="flex items-center gap-3 flex-grow">
                            <div className={cn("w-2 h-2 rounded-full", isConnected ? 'bg-green-500' : 'bg-gray-500')} title={isConnected ? 'Conectado' : 'Libre'}></div>
                            <div>
                              <span className="text-gray-200 font-medium">{port.name || 'Puerto sin nombre'}</span>
                              <Badge variant="outline" className="ml-2 text-xs border-cyan-500/50 text-cyan-300">{port.port_type || 'N/A'}</Badge>
                            </div>
                            {isConnected && connection && (
                               <div className="flex items-center text-gray-400 text-xs ml-4 gap-2">
                                 <ArrowRight className="h-3 w-3 text-cyan-400" />
                                 <span>Conectado...</span> {/* Simplified for now */}
                               </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isConnected && connection && <CableDetailsTooltip connection={connection} />}
                            {isConnected ? (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDisconnect(port.id)}><Trash2 className="h-4 w-4"/></Button>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setPortToConnect(port); setConnectionMode('standard'); setIsConnectDialogOpen(true); }}><Cable className="h-4 w-4"/></Button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
      
      {portToConnect && (
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50 sm:max-w-4xl">
             <ConnectPortDialog 
                portA={portToConnect}
                portA_assetType={asset?.asset_type || null}
                tenantId={tenantId}
                assetsInSameRack={assetsInSameRack}
                connectionMode={connectionMode}
                onSuccess={() => { setIsConnectDialogOpen(false); setPortToConnect(null); router.refresh(); }}
                onCancel={() => { setIsConnectDialogOpen(false); setPortToConnect(null); }}
             />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
