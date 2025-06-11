
'use client'; // This page now uses client-side state for the dialog

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'; // Changed to client for dialog interaction
import { useRouter } from 'next/navigation'; // For router.refresh()
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RackCard } from '@/components/racks/RackCard';
import { CreateRackForm } from '@/components/racks/CreateRackForm'; // Import the form
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Import Dialog
import { PlusCircle, Search, LayoutDashboard, ListFilter, MapPin, Loader2 } from 'lucide-react';
import type { Database } from '@/lib/database.types';
import { useToast } from '@/hooks/use-toast';


type RackOverview = Database['public']['Functions']['get_racks_overview']['Returns'][number];
type Location = Database['public']['Tables']['locations']['Row'];

// This page is now a client component to manage Dialog state
export default function RacksPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [racks, setRacks] = useState<RackOverview[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [racksError, setRacksError] = useState<string | null>(null);
  const [isCreateRackDialogOpen, setIsCreateRackDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({ title: 'Error de autenticación', description: 'No se pudo obtener el usuario.', variant: 'destructive' });
        setIsLoading(false);
        router.push('/login'); // Redirect if no user
        return;
      }
      setUserId(user.id);

      // Fetch Racks Overview
      const { data: racksData, error: racksRpcError } = await supabase
        .rpc('get_racks_overview', { tenant_id_param: user.id });

      if (racksRpcError) {
        console.error('Error fetching racks overview:', racksRpcError.message);
        setRacksError(racksRpcError.message);
        toast({ title: 'Error al cargar racks', description: racksRpcError.message, variant: 'destructive' });
      } else {
        setRacks(racksData || []);
      }

      // Fetch Locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('tenant_id', user.id);
      
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


  const uniqueLocations = racks && racks.length > 0 
    ? [...new Set(racks.map(r => r.location_name).filter(Boolean as any as (value: string | null) => value is string))] 
    : ["All Locations"];
  const uniqueStatuses = racks && racks.length > 0 
    ? [...new Set(racks.map(r => r.status).filter(Boolean as any as (value: string | null) => value is string))] 
    : ["All Statuses"];


  const handleCreateRackSuccess = () => {
    setIsCreateRackDialogOpen(false);
    router.refresh(); // Refresh data on the page
    // Re-fetch data to update the list (alternative to router.refresh if specific state update is needed)
    async function refetchRacks() {
        if (!userId) return;
        const { data: racksData, error: racksRpcError } = await supabase
        .rpc('get_racks_overview', { tenant_id_param: userId });
        if (!racksRpcError) setRacks(racksData || []);
    }
    refetchRacks();
  };

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
            Rack Management
          </h1>
          <Link href="/dashboard">
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search by name, location, or asset..."
              className="pl-10 bg-input border-purple-500/30 focus:ring-primary focus:border-primary text-gray-50"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="status-filter" className="text-xs text-gray-400 flex items-center"><ListFilter className="w-3 h-3 mr-1"/>Status</label>
            <Select defaultValue="all">
              <SelectTrigger id="status-filter" className="bg-input border-purple-500/30 text-gray-300 focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status.toLowerCase() || 'unknown'}>{status || 'Unknown'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label htmlFor="location-filter" className="text-xs text-gray-400 flex items-center"><MapPin className="w-3 h-3 mr-1"/>Location</label>
            <Select defaultValue="all">
              <SelectTrigger id="location-filter" className="bg-input border-purple-500/30 text-gray-300 focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                <SelectItem value="all">All Locations</SelectItem>
                 {uniqueLocations.map(locationName => (
                  <SelectItem key={locationName} value={locationName.toLowerCase() || 'unknown'}>{locationName || 'N/A'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <Dialog open={isCreateRackDialogOpen} onOpenChange={setIsCreateRackDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create New Rack
                </Button>
              </DialogTrigger>
              <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50 sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl text-gray-50">Crear Nuevo Rack</DialogTitle>
                </DialogHeader>
                {userId && (
                  <CreateRackForm 
                    locations={locations} 
                    tenantId={userId} 
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
          <p>Could not load rack data. Please ensure the database is set up correctly and the 'get_racks_overview' RPC function exists and is up to date.</p>
          <p className="text-xs mt-1">{racksError}</p>
        </div>
      )}

      {!racksError && !isLoading && racks.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          <p className="text-xl">No racks found.</p>
          <p>Get started by creating a new rack.</p>
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

    