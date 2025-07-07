
'use client'; 

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'; 
import { useRouter } from 'next/navigation'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RackCard } from '@/components/racks/RackCard';
import { CreateRackForm } from '@/components/racks/CreateRackForm'; 
// CreateLocationForm import removed as the button/dialog is removed from this page
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; 
import { PlusCircle, Search, LayoutDashboard, ListFilter, MapPin, Loader2 } from 'lucide-react';
import type { Database } from '@/lib/database.types';
import { useToast } from '@/hooks/use-toast';

type RackOverview = Database['public']['Functions']['get_racks_overview']['Returns'][number];
type Location = Pick<Database['public']['Tables']['locations']['Row'], 'id' | 'name'>;


export default function RacksPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [racks, setRacks] = useState<RackOverview[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [racksError, setRacksError] = useState<string | null>(null);
  const [isCreateRackDialogOpen, setIsCreateRackDialogOpen] = useState(false);
  // State for Create Location Dialog removed
  
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({ title: 'Error de autenticación', description: 'No se pudo obtener el usuario. Redirigiendo al login.', variant: 'destructive' });
        router.push('/login'); 
        setIsLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || !profile.tenant_id) {
          toast({ title: 'Error de perfil', description: 'No se pudo encontrar el perfil o tenant del usuario.', variant: 'destructive' });
          setIsLoading(false);
          return;
      }
      
      const currentTenantId = profile.tenant_id;
      setTenantId(currentTenantId); 

      const [racksResult, locationsResult] = await Promise.all([
        supabase.rpc('get_racks_overview', { tenant_id_param: currentTenantId }),
        supabase.from('locations').select('id, name').eq('tenant_id', currentTenantId)
      ]);

      const { data: racksData, error: racksRpcError } = racksResult;
      if (racksRpcError) {
        console.error('Error fetching racks overview:', racksRpcError.message);
        setRacksError(racksRpcError.message);
        toast({ title: 'Error al cargar racks', description: racksRpcError.message, variant: 'destructive' });
      } else {
        setRacks(racksData || []);
      }

      const { data: locationsData, error: locationsError } = locationsResult;
      if (locationsError) {
        console.error('Error fetching locations:', locationsError.message);
        toast({ title: 'Error al cargar ubicaciones', description: locationsError.message, variant: 'destructive' });
      } else {
        setLocations(locationsData || []);
      }
      
      setIsLoading(false);
    }
    fetchData();
  }, [supabase, router, toast]);


  const uniqueLocations = locations && locations.length > 0
    ? [...new Set(locations.map(l => l.name).filter(Boolean as any as (value: string | null) => value is string))]
    : ["Todas las Ubicaciones"];
  const uniqueStatuses = racks && racks.length > 0 
    ? [...new Set(racks.map(r => r.status).filter(Boolean as any as (value: string | null) => value is string))] 
    : ["Todos los Estados"];


  const refetchData = async () => {
    if (!tenantId) return; // Ensure tenantId is available
    setIsLoading(true); // Set loading state true while refetching
    const [racksResult, locationsResult] = await Promise.all([
        supabase.rpc('get_racks_overview', { tenant_id_param: tenantId }),
        supabase.from('locations').select('id, name').eq('tenant_id', tenantId)
    ]);
    if (!racksResult.error) {
        setRacks(racksResult.data || []);
    } else {
        toast({ title: 'Error al recargar racks', description: racksResult.error.message, variant: 'destructive' });
    }
    if (!locationsResult.error) {
        setLocations(locationsResult.data || []);
    } else {
        toast({ title: 'Error al recargar ubicaciones', description: locationsResult.error.message, variant: 'destructive' });
    }
    setIsLoading(false); // Set loading state false after refetching
  };

  const handleCreateRackSuccess = () => {
    setIsCreateRackDialogOpen(false);
    refetchData(); // Refetch all data including locations as new rack might affect overall view
  };

  // handleCreateLocationSuccess removed as the button/dialog is removed

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex justify-center items-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            Gestión de Racks
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar por nombre, ubicación o activo..."
              className="pl-10 bg-input border-white/20 focus:ring-primary focus:border-primary text-gray-50"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="status-filter" className="text-xs text-gray-400 flex items-center"><ListFilter className="w-3 h-3 mr-1"/>Estado</label>
            <Select defaultValue="all">
              <SelectTrigger id="status-filter" className="bg-input border-white/20 text-gray-300 focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                <SelectItem value="all">Todos los Estados</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status.toLowerCase() || 'unknown'}>{status || 'Desconocido'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label htmlFor="location-filter" className="text-xs text-gray-400 flex items-center"><MapPin className="w-3 h-3 mr-1"/>Ubicación</label>
            <Select defaultValue="all">
              <SelectTrigger id="location-filter" className="bg-input border-white/20 text-gray-300 focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Filtrar por ubicación" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                <SelectItem value="all">Todas las Ubicaciones</SelectItem>
                 {uniqueLocations.map(locationName => (
                  <SelectItem key={locationName} value={locationName.toLowerCase() || 'unknown'}>{locationName || 'N/A'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Button for "+ Nueva Ubicación" and its Dialog REMOVED */}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
            <Dialog open={isCreateRackDialogOpen} onOpenChange={setIsCreateRackDialogOpen}>
              <DialogTrigger asChild>
                <Button className="glassmorphic-card bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-white/20">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Crear Nuevo Rack
                </Button>
              </DialogTrigger>
              <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50 sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl text-gray-50">Crear Nuevo Rack</DialogTitle>
                </DialogHeader>
                {tenantId && (
                  <CreateRackForm 
                    locations={locations} 
                    tenantId={tenantId} 
                    onSuccess={handleCreateRackSuccess}
                    onCancel={() => setIsCreateRackDialogOpen(false)}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
      </header>

      {racksError && (
        <div className="text-center text-destructive-foreground bg-destructive/80 p-4 rounded-md">
          <p>No se pudieron cargar los datos de los racks. Asegúrate de que la base de datos esté configurada correctamente y que la función RPC 'get_racks_overview' exista y esté actualizada.</p>
          <p className="text-xs mt-1">{racksError}</p>
        </div>
      )}

      {!racksError && !isLoading && racks.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          <p className="text-xl">No se encontraron racks.</p>
          <p>Comienza creando una nueva ubicación y luego un nuevo rack.</p>
        </div>
      )}

      {!racksError && !isLoading && racks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {racks.map((rack) => (
            <RackCard key={rack.id} rack={rack} />
          ))}
        </div>
      )}
    </div>
  );
}
