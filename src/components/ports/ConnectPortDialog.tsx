
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Search, X, ChevronRight, Server, List } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PortDetails, AssetWithPorts } from '@/lib/database.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '../ui/separator';

interface ConnectPortDialogProps {
  portA: PortDetails;
  tenantId: string;
  assetsInSameRack: AssetWithPorts[];
  onSuccess: () => void;
  onCancel: () => void;
}

type AssetSearchResult = {
  id: string;
  name: string | null;
};

type FreePort = {
  id: string;
  name: string | null;
  port_type: string | null;
}

export function ConnectPortDialog({ portA, tenantId, assetsInSameRack, onSuccess, onCancel }: ConnectPortDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<AssetSearchResult | null>(null);
  const [targetPorts, setTargetPorts] = useState<FreePort[]>([]);
  const [isLoadingPorts, setIsLoadingPorts] = useState(false);
  const [selectedPortB, setSelectedPortB] = useState<FreePort | null>(null);

  const assetIdsInRack = useMemo(() => assetsInSameRack.map(a => a.id), [assetsInSameRack]);

  useEffect(() => {
    const searchAssets = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data, error } = await supabase
        .from('assets')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${debouncedSearchTerm}%`)
        .not('id', 'in', `(${[portA.asset_id, ...assetIdsInRack].map(id => `'${id}'`).join(',')})`)
        .limit(10);

      if (error) {
        console.error("Error searching assets:", error);
      } else {
        setSearchResults(data);
      }
      setIsSearching(false);
    };
    if (debouncedSearchTerm) {
      searchAssets();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, supabase, tenantId, portA.asset_id, assetIdsInRack]);

  const handleSelectAsset = async (asset: AssetSearchResult) => {
    setSelectedAsset(asset);
    setSelectedPortB(null);
    setIsLoadingPorts(true);
    
    const { data, error } = await supabase.rpc('get_free_ports_for_asset', { asset_id_param: asset.id });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los puertos del activo de destino.', variant: 'destructive'});
      setTargetPorts([]);
    } else {
      setTargetPorts(data || []);
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
      });

    setIsLoading(false);

    if (error) {
      toast({ title: 'Error', description: `No se pudo crear la conexión: ${error.message}`, variant: 'destructive' });
    } else {
      toast({ title: 'Éxito', description: `Conexión creada entre ${portA.name} y ${selectedPortB.name}.` });
      onSuccess();
    }
  };

  const memoizedPortList = useMemo(() => (
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
  ), [isLoadingPorts, targetPorts, selectedPortB]);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline text-2xl">Conectar Puerto: <span className="text-primary">{portA.name}</span></DialogTitle>
        <DialogDescription>
          Selecciona un activo y un puerto libre para establecer la conexión.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 h-96">
        {/* Columna 1: Búsqueda y selección de activo */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold flex items-center"><Server className="mr-2 h-4 w-4 text-sky-400"/>1. Buscar Activo de Destino</h3>
          
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">En este Rack</h4>
            <ScrollArea className="h-32 border rounded-md p-2 bg-input/50">
              {assetsInSameRack.length > 0 ? (
                <ul className="space-y-1">
                  {assetsInSameRack.map(asset => (
                    <li key={asset.id}>
                      <Button variant="ghost" className="w-full justify-between" onClick={() => handleSelectAsset(asset)}>
                        {asset.name} <ChevronRight className="h-4 w-4"/>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-center text-sm text-gray-400 pt-4">No hay otros activos en este rack.</p>
              }
            </ScrollArea>
          </div>
          
          <Separator />

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Buscar en otra ubicación</h4>
            <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                type="text"
                placeholder="Escribe el nombre del activo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-purple-500/30 text-gray-50"
                />
            </div>
            <ScrollArea className="h-32 border rounded-md p-2 bg-input/50">
                {isSearching ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div>
                : searchResults.length > 0 ? (
                    <ul className="space-y-1">
                        {searchResults.map(asset => (
                        <li key={asset.id}>
                            <Button variant="ghost" className="w-full justify-between" onClick={() => handleSelectAsset(asset)}>
                            {asset.name} <ChevronRight className="h-4 w-4"/>
                            </Button>
                        </li>
                        ))}
                    </ul>
                ) : <p className="text-center text-sm text-gray-400 pt-4">No se encontraron activos.</p>
                }
            </ScrollArea>
          </div>
        </div>
        
        {/* Columna 2: Selección de puerto */}
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold flex items-center"><List className="mr-2 h-4 w-4 text-lime-400"/>2. Seleccionar Puerto Libre</h3>
          {selectedAsset ? (
            <>
              <div className="flex items-center justify-between p-2 rounded-md bg-purple-500/10">
                <span className="text-sm font-medium text-purple-300">Activo: {selectedAsset.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedAsset(null); setTargetPorts([]); setSelectedPortB(null); }}><X className="h-4 w-4"/></Button>
              </div>
              <div className="flex-grow">
                {memoizedPortList}
              </div>
            </>
          ) : (
            <div className="h-full border rounded-md p-2 bg-input/50 flex items-center justify-center">
              <p className="text-sm text-gray-500">Selecciona un activo para ver sus puertos.</p>
            </div>
          )}
        </div>
      </div>

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
