import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ServerCrash } from 'lucide-react';
import { FloorPlanView } from '@/components/floor-plan/FloorPlanView';
import type { Database } from '@/lib/database.types';

// El tipo para los detalles de la ubicación, tal como lo devuelve nuestra RPC
type LocationDetails = Database['public']['Functions']['get_location_details']['Returns'][number] | null;

interface FloorPlanDetailPageProps {
  params: { id: string };
}

export default async function FloorPlanDetailPage({ params }: FloorPlanDetailPageProps) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  
  if (profileError || !profile || !profile.tenant_id) {
    return <div>Error de perfil</div>;
  }
  
  const tenantId = profile.tenant_id;
  const locationId = params.id;

  // Llamar a la RPC para obtener los detalles de ESTA ubicación específica
  let locationDetails: LocationDetails = null;
  if (locationId) {
    const { data, error } = await supabase
      .rpc('get_location_details', { location_id_param: locationId });
    
    if (error) {
      console.error(`Error fetching details for location ${locationId}:`, error.message);
      // locationDetails permanecerá null, y el front-end mostrará el error.
    } else {
      locationDetails = data?.[0] || null;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            {locationDetails ? `Plano: ${locationDetails.name}` : 'Cargando Plano...'}
          </h1>
          <p className="text-gray-400">Visualiza, configura y gestiona tu layout.</p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <Link href="/floor-plan">
              <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                Ver Todas las Ubicaciones
              </Button>
          </Link>
          <Link href="/dashboard">
              <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Volver al Dashboard
              </Button>
          </Link>
        </div>
      </header>
      
      <main>
        {/* Pasar los datos necesarios al componente cliente */}
        <FloorPlanView 
          locationDetails={locationDetails}
          tenantId={tenantId}
        />
      </main>

    </div>
  );
}
