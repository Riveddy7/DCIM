// src/app/floor-plan/page.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, AlertTriangle } from 'lucide-react';
import { LocationCard } from '@/components/floor-plan/LocationCard';
import type { Database } from '@/lib/database.types';

type LocationWithPlanStatus = Pick<Database['public']['Tables']['locations']['Row'], 'id' | 'name' | 'floor_plan_image_url'>;

export default async function FloorPlanSelectionPage() {
  const supabase = createClient();

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
    return (
        <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-destructive-foreground">Error de Perfil</h2>
            <p className="text-gray-400">No se pudo encontrar un perfil de tenant asociado a tu usuario.</p>
        </div>
    );
  }
  
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, floor_plan_image_url')
    .eq('tenant_id', profile.tenant_id)
    .order('name', { ascending: true });

  if (locationsError) {
    console.error('Error fetching locations:', locationsError.message);
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            Planos de Planta
          </h1>
          <p className="text-gray-400">Selecciona una ubicación para ver o configurar su plano.</p>
        </div>
        <Link href="/dashboard">
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 mt-4 sm:mt-0">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
        </Link>
      </header>
      
      <main>
        {(!locations || locations.length === 0) ? (
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-amber-500/30 rounded-lg bg-gray-900/40">
                <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
                <h2 className="text-xl font-bold text-amber-300">No hay ubicaciones creadas</h2>
                <p className="text-gray-400">Primero necesitas crear una ubicación desde la sección de gestión de racks.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {(locations as LocationWithPlanStatus[]).map(location => (
                    <LocationCard key={location.id} location={location} />
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
