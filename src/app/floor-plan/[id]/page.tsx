// ESTE CÓDIGO PERTENECE AL ARCHIVO: app/floor-plan/[id]/page.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard } from 'lucide-react';
import { FloorPlanView } from '@/components/floor-plan/FloorPlanView'; // Importas el componente cliente
import type { Database } from '@/lib/database.types';

// Definimos el tipo que devuelve nuestra RPC. Es un objeto, no un array.
type LocationDetails = Database['public']['Functions']['get_location_details']['Returns'];

// Las props de la página dinámica incluyen `params` con el `id` de la URL
interface FloorPlanDetailPageProps {
  params: { id: string }; 
}

export default async function FloorPlanDetailPage({ params }: FloorPlanDetailPageProps) {
  const supabase = createClient();
  const locationId = params.id;

  // 1. Obtener usuario y tenantId (esto es crucial para la seguridad)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.tenant_id) {
    // Manejar error si no se encuentra el perfil del tenant
    return <div>Error: Perfil de organización no encontrado.</div>;
  }
  
  const tenantId = profile.tenant_id;

  // 2. LLAMADA A LA RPC CORREGIDA: Pasamos AMBOS parámetros, `location_id` y `tenant_id`
  const { data: locationDetails, error: detailsError } = await supabase
    .rpc('get_location_details', { 
      location_id_param: locationId,
      tenant_id_param: tenantId
    });

  if (detailsError) {
    // Este console.log es el que te está mostrando el error en la terminal del servidor
    console.error(`Error fetching details for location ${locationId}:`, detailsError.message);
  }

  // 3. Determinar el título de la página dinámicamente
  const pageTitle = locationDetails?.location?.name 
    ? `Plano: ${locationDetails.location.name}`
    : 'Cargando Plano...';

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            {pageTitle}
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
        {/* 4. Pasamos los datos obtenidos al componente cliente 'FloorPlanView' */}
        <FloorPlanView 
          locationDetails={locationDetails}
          tenantId={tenantId}
        />
      </main>

    </div>
  );
}