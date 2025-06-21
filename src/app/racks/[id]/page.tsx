
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, ServerCrash } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RackDetailView } from '@/components/racks/RackDetailView';
import type { RackWithAssetsAndPorts } from '@/lib/database.types';

interface RackDetailPageProps {
  params: { id: string };
}

export default async function RackDetailPage({ params }: RackDetailPageProps) {
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
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <ServerCrash className="h-24 w-24 text-destructive mb-6" />
        <h1 className="text-3xl font-bold font-headline text-gray-50 mb-2">Error de Configuración</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          No se pudo cargar la información de tu organización (tenant). Por favor, contacta al soporte.
        </p>
        {profileError && <p className="text-xs text-gray-500 mb-6">Detalle: {profileError.message}</p>}
        <Link href="/dashboard">
          <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const tenantId = profile.tenant_id;
  const rackId = params.id;

  const { data: rackData, error: rackError } = await supabase
    .from('racks')
    .select(`
      id, name, total_u, location_id, notes,
      assets (
        id, name, asset_type, status, start_u, size_u, details,
        ports (
          id, name, port_type, asset_id,
          connections_port_a:connections!port_a_id(id, port_b_id),
          connections_port_b:connections!port_b_id(id, port_a_id)
        )
      )
    `)
    .eq('id', rackId)
    .eq('tenant_id', tenantId)
    .single<RackWithAssetsAndPorts>();

  if (rackError) {
    console.error('Error fetching rack details:', rackError.message);
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <ServerCrash className="h-24 w-24 text-destructive mb-6" />
        <h1 className="text-3xl font-bold font-headline text-gray-50 mb-2">Error al Cargar el Rack</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          No pudimos cargar los detalles para el rack solicitado. Es posible que no exista o que haya ocurrido un error en el servidor.
        </p>
        <p className="text-xs text-gray-500 mb-6">Detalle: {rackError.message}</p>
        <Link href="/racks">
          <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la Lista de Racks
          </Button>
        </Link>
      </div>
    );
  }

  if (!rackData) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <AlertTriangle className="h-24 w-24 text-amber-400 mb-6" />
        <h1 className="text-3xl font-bold font-headline text-gray-50 mb-2">Rack No Encontrado</h1>
        <p className="text-gray-400 mb-6">El rack con ID <span className="font-semibold text-primary">{rackId}</span> no fue encontrado para tu organización.</p>
        <Link href="/racks">
          <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la Lista de Racks
          </Button>
        </Link>
      </div>
    );
  }
  
  return <RackDetailView rackData={rackData} tenantId={tenantId} />;
}
