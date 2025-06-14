
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

  const rackId = params.id;

  const { data: rackData, error } = await supabase
    .from('racks')
    .select(`
      id, name, total_u, description, status, location_id,
      assets (
        id, name, asset_type, status, start_u, size_u, details,
        ports ( id, name, port_type )
      )
    `)
    .eq('id', rackId)
    .eq('tenant_id', user.id) 
    .single<RackWithAssetsAndPorts>();

  if (error) {
    console.error('Error fetching rack details:', error.message);
    // Consider a more user-friendly error page or a redirect with a message
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <ServerCrash className="h-24 w-24 text-destructive mb-6" />
        <h1 className="text-3xl font-bold font-headline text-gray-50 mb-2">Error al Cargar el Rack</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          No pudimos cargar los detalles para el rack solicitado. Es posible que no exista o que haya ocurrido un error en el servidor.
        </p>
        <p className="text-xs text-gray-500 mb-6">Detalle: {error.message}</p>
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
        <p className="text-gray-400 mb-6">El rack con ID <span className="font-semibold text-primary">{rackId}</span> no fue encontrado.</p>
        <Link href="/racks">
          <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la Lista de Racks
          </Button>
        </Link>
      </div>
    );
  }
  
  return <RackDetailView rackData={rackData} />;
}

```