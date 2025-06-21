
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, X, ChevronRight, Server, List, Network, PlusCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PortDetails, AssetWithPorts, Tables } from '@/lib/database.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CableDetailsForm } from './CableDetailsForm';
import { CreateEndpointForm } from '../endpoints/CreateEndpointForm';

interface ConnectPortDialogProps {
  portA: PortDetails;
  portA_assetType: string | null;
  tenantId: string;
  assetsInSameRack: AssetWithPorts[];
  connectionMode: 'standard' | 'endpoint';
  onSuccess: () => void;
  onCancel: () => void;
}

type FreePort = {
  id: string;
  name: string | null;
  port_type: string | null;
}

type Location = Pick<Tables<'locations'>, 'id' | 'name'>;


export function ConnectPortDialog({ portA, portA_assetType, tenantId, assetsInSameRack, connectionMode, onSuccess, onCancel }: ConnectPortDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetWithPorts | null>(null);
  const [targetPorts, setTargetPorts] = useState<FreePort[]>([]);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);
  const [selectedPortB, setSelectedPortB] = useState<FreePort | null>(null);
  const [cableDetails, setCableDetails] = useState<Record<string, any> | null>(null);

  // New state for endpoint connection mode
  const [isCreateEndpointDialogOpen, setIsCreateEndpointDialogOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [unconnectedEndpoints, setUnconnectedEndpoints] = useState<Tables<'assets'>[]>([]);
  
  useEffect(() => {
    if (connectionMode === 'endpoint') {
      const fetchEndpointData = async () => {
        setIsLoading(true);
        const [locationsRes, endpointsRes] = await Promise.all([
          supabase.from('locations').select('id, name').eq('tenant_id', tenantId),
          supabase.rpc('get_unconnected_endpoints', { tenant_id_param: tenantId })
        ]);
        
        if (locationsRes.error) {
          toast({ title: 'Error', description: 'No se pudieron cargar las ubicaciones.', variant: 'destructive'});
        } else {
          setLocations(locationsRes.data || []);
        }

        if (endpointsRes.error) {
          toast({ title: 'Error', description: 'No se pudieron cargar los puntos de red de usuario.', variant: 'destructive'});
        } else {
          setUnconnectedEndpoints(endpointsRes.data || []);
        }
        setIsLoading(false);
      };
      fetchEndpointData();
    }
  }, [connectionMode, tenantId, supabase, toast]);


  const handleSelectAsset = async (asset: AssetWithPorts | Tables<'assets'>) => {
    setSelectedAsset(asset as AssetWithPorts); // Cast for now, may need adjustment
    setSelectedPortB(null);
    setIsLoadingPorts(true);
    
    const rpcToCall = asset.asset_type === 'ENDPOINT_USER' ? 'get_free_ports_for_asset' : 'get_free_ports_for_asset';
    const { data, error } = await supabase.rpc(rpcToCall, { asset_id_param: asset.id });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los puertos del activo de destino.', variant: 'destructive'});
      setTargetPorts([]);
    } else {
      let filteredPorts = data || [];
      if (portA_assetType === 'SWITCH' && asset.asset_type === 'PATCH_PANEL') {
        filteredPorts = filteredPorts.filter(p => p.name && p.name.endsWith('-F'));
      }
      setTargetPorts(filteredPorts);
    }
    setIsLoadingPorts(false);
  };
  
  const handleConfirmConnection = async () => {
    if (!selectedPortB) return;
    setIsLoading(true);

    const { error } = await supabase
      .from('connections')
      .insert({
        port_a_id: portA.id,
        port_b_id: selectedPortB.id,
        tenant_id: tenantId,
        details: cableDetails,
      });

    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: `No se pudo crear la conexión: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: `Conexión creada entre ${portA.name} y ${selectedPortB.name}.` });
      onSuccess();
    }
  };

  const renderStandardConnectionUI = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 h-96">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold flex items-center"><Server className="mr-2 h-4 w-4 text-sky-400"/>1. Seleccionar Activo de Destino</h3>
            <ScrollArea className="h-full border rounded-md p-2 bg-input/50 flex-grow">
              {assetsInSameRack.length > 0 ? (
                <ul className="space-y-1">
                  {assetsInSameRack.map(asset => (
                    <li key={asset.id}>
                      <Button variant={selectedAsset?.id === asset.id ? "secondary" : "ghost"} className="w-full justify-between" onClick={() => handleSelectAsset(asset)}>
                        {asset.name}
                        <Badge variant="outline" className="text-xs">{asset.asset_type}</Badge>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-center text-sm text-gray-400 pt-4">No hay otros activos en este rack.</p>
              }
            </ScrollArea>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold flex items-center"><List className="mr-2 h-4 w-4 text-lime-400"/>2. Seleccionar Puerto Libre</h3>
            {selectedAsset ? (
              <>
                <div className="flex items-center justify-between p-2 rounded-md bg-purple-500/10">
                  <span className="text-sm font-medium text-purple-300">Activo: {selectedAsset.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedAsset(null); setTargetPorts([]); setSelectedPortB(null); }}><X className="h-4 w-4"/></Button>
                </div>
                <ScrollArea className="h-72 border rounded-md p-2 bg-input/50">
                  {isLoadingPorts ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
                    : targetPorts.length > 0 ? (
                      <ul className="space-y-1">
                        {targetPorts.map(port => (
                          <li key={port.id}>
                            <Button variant="ghost" className={cn("w-full justify-start gap-2", selectedPortB?.id === port.id && "bg-primary/20")} onClick={() => setSelectedPortB(port)}>
                              <div className={cn("w-2 h-2 rounded-full", selectedPortB?.id === port.id ? 'bg-green-400' : 'bg-gray-500')}></div>
                              {port.name} 
                              <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-300">{port.port_type || 'N/A'}</Badge>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-center text-sm text-gray-400 pt-4">No hay puertos libres en este activo.</p>
                  }
                </ScrollArea>
              </>
            ) : (
              <div className="h-full border rounded-md p-2 bg-input/50 flex items-center justify-center">
                <p className="text-sm text-gray-500">Selecciona un activo para ver sus puertos.</p>
              </div>
            )}
          </div>
        </div>

        {selectedPortB && (
          <CableDetailsForm onDetailsChange={setCableDetails} />
        )}
    </>
  );
  
  const renderEndpointConnectionUI = () => (
    <>
      <div className="flex flex-col gap-4 mt-4 h-96">
        <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center"><Network className="mr-2 h-4 w-4 text-cyan-400"/>1. Seleccionar Punto de Red de Usuario</h3>
            <Dialog open={isCreateEndpointDialogOpen} onOpenChange={setIsCreateEndpointDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4"/> Crear Nuevo Punto de Red
                </Button>
              </DialogTrigger>
              <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Crear Nuevo Punto de Red de Usuario</DialogTitle>
                  <DialogDescription>
                    Define un nuevo punto final de usuario (nodo) y conéctalo al puerto trasero del patch panel.
                  </DialogDescription>
                </DialogHeader>
                <CreateEndpointForm 
                   tenantId={tenantId}
                   rearPortToConnect={portA}
                   locations={locations}
                   onSuccess={() => { setIsCreateEndpointDialogOpen(false); onSuccess(); }}
                   onCancel={() => setIsCreateEndpointDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
        </div>
        <ScrollArea className="h-full border rounded-md p-2 bg-input/50 flex-grow">
          {isLoading && <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>}
          {!isLoading && unconnectedEndpoints.length === 0 && (
             <p className="text-center text-sm text-gray-400 pt-4">No hay puntos de red de usuario sin conectar.</p>
          )}
          {!isLoading && unconnectedEndpoints.length > 0 && (
              <ul className="space-y-1">
                {unconnectedEndpoints.map(endpoint => (
                  <li key={endpoint.id}>
                    <Button variant={selectedAsset?.id === endpoint.id ? "secondary" : "ghost"} className="w-full justify-between" onClick={() => handleSelectAsset(endpoint)}>
                      {endpoint.name}
                      <Badge variant="outline" className="text-xs">{locations.find(l => l.id === endpoint.location_id)?.name || 'N/A'}</Badge>
                    </Button>
                  </li>
                ))}
              </ul>
          )}
        </ScrollArea>
        
        {selectedAsset && (
          <>
            <h3 className="font-semibold flex items-center mt-4"><List className="mr-2 h-4 w-4 text-lime-400"/>2. Seleccionar Puerto</h3>
            <div className="border rounded-md p-2 bg-input/50">
              {isLoadingPorts ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
                : targetPorts.length > 0 ? (
                  <ul className="space-y-1">
                    {targetPorts.map(port => (
                      <li key={port.id}>
                        <Button variant="ghost" className={cn("w-full justify-start gap-2", selectedPortB?.id === port.id && "bg-primary/20")} onClick={() => setSelectedPortB(port)}>
                          <div className={cn("w-2 h-2 rounded-full", selectedPortB?.id === port.id ? 'bg-green-400' : 'bg-gray-500')}></div>
                          {port.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-center text-sm text-gray-400 py-2">No hay puertos libres en este punto de red.</p>
              }
            </div>
          </>
        )}

      </div>
       {selectedPortB && (
          <CableDetailsForm onDetailsChange={setCableDetails} />
        )}
    </>
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">Conectar Puerto: <span className="text-primary">{portA.name}</span></DialogTitle>
        <DialogDescription>
          {connectionMode === 'standard' 
            ? 'Selecciona un activo en este rack y un puerto libre para establecer la conexión.'
            : 'Conecta este puerto trasero a un punto de red de usuario final.'
          }
        </DialogDescription>
      </DialogHeader>

      {connectionMode === 'standard' ? renderStandardConnectionUI() : renderEndpointConnectionUI()}
      
      <div className="flex justify-end gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
          Cancelar
        </Button>
        <Button type="button" onClick={handleConfirmConnection} disabled={isLoading || !selectedPortB} className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirmar Conexión
        </Button>
      </div>
    </>
  );
}

