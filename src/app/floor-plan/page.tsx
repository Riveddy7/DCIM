
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ServerCrash } from 'lucide-react';
import { FloorPlanView } from '@/components/floor-plan/FloorPlanView';
import type { Database } from '@/lib/database.types';

type Location = Pick<Database['public']['Tables']['locations']['Row'], 'id' | 'name'>;

export default async function FloorPlanPage() {
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
    console.error('Error fetching profile or tenant ID:', profileError?.message);
    // You could redirect to an error page or show an error message
    return (
      <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center text-center">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error de Perfil de Usuario</h1>
        <p className="text-gray-400">No se pudo cargar la información de tu organización.</p>
        <Link href="/dashboard" className="mt-6">
            <Button variant="outline"><LayoutDashboard className="mr-2"/> Volver al Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  const tenantId = profile.tenant_id;
  
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name')
    .eq('tenant_id', tenantId);

  if (locationsError) {
    console.error('Error fetching locations:', locationsError.message);
    // Handle error appropriately
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            Planos de Planta
          </h1>
          <p className="text-gray-400">Visualiza, configura y gestiona tus layouts.</p>
        </div>
        <Link href="/dashboard">
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 mt-4 sm:mt-0">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
        </Link>
      </header>
      
      <main>
        <FloorPlanView locations={locations || []} tenantId={tenantId} />
      </main>

    </div>
  );
}
