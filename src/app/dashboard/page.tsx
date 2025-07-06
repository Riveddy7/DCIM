
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { KPICard } from '@/components/dashboard/KPI_Card';
import { AIAssistantWidget } from '@/components/dashboard/AI_Assistant_Widget';
import { ToDoListWidget } from '@/components/dashboard/ToDo_List_Widget';
import { NetworkPortsProgressCard } from '@/components/dashboard/NetworkPortsProgressCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Archive, HardDrive, Container, FileQuestion, Map } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id, full_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.tenant_id) {
    console.error('Error fetching profile or tenant ID:', profileError?.message);
    redirect('/login');
  }

  const tenantId = profile.tenant_id;

  let totalRacks = 0;
  const { count: racksCount, error: racksError } = await supabase
    .from('racks')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (racksError) {
    console.error('Error fetching total racks:', racksError.message);
  } else {
    totalRacks = racksCount || 0;
  }

  let networkPortsStats = { total_ports: 0, used_ports: 0 };
  const { data: portsStatsData, error: portsStatsError } = await supabase
    .rpc('get_network_ports_stats', { tenant_id_param: tenantId });

  if (portsStatsError) {
    console.error('Error fetching network ports stats:', portsStatsError.message);
  } else if (portsStatsData && portsStatsData.length > 0) {
    networkPortsStats = {
        total_ports: Number(portsStatsData[0].total_ports) || 0,
        used_ports: Number(portsStatsData[0].used_ports) || 0,
    };
  }

  let totalAssets = 0;
  const { count: assetsCount, error: assetsError } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (assetsError) {
    console.error('Error fetching total assets:', assetsError.message);
  } else {
    totalAssets = assetsCount || 0;
  }

  let fullestRackInfo = { id: '', name: 'N/A', occupancy_percentage: 0 };
  const { data: fullestRackData, error: fullestRackError } = await supabase
    .rpc('get_fullest_rack', { tenant_id_param: tenantId });
  if (fullestRackError) {
    console.error('Error fetching fullest rack:', fullestRackError.message);
  } else if (fullestRackData && fullestRackData.length > 0 && fullestRackData[0]) {
    fullestRackInfo = {
        id: fullestRackData[0].id || '',
        name: fullestRackData[0].name || 'N/A',
        occupancy_percentage: parseFloat(Number(fullestRackData[0].occupancy_percentage).toFixed(1)) || 0
    };
  }
  
  let unassignedAssets = 0;
  const { count: unassignedAssetsCount, error: unassignedAssetsError } = await supabase
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .is('rack_id', null)
    .eq('tenant_id', tenantId);
  if (unassignedAssetsError) {
    console.error('Error fetching unassigned assets:', unassignedAssetsError.message);
  } else {
    unassignedAssets = unassignedAssetsCount || 0;
  }
  
  const userName = profile.full_name || user.email?.split('@')[0] || 'Usuario';
  
  const handleLogout = async () => {
    "use server";
    const supabaseClient = createClient();
    await supabaseClient.auth.signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            Hola, <span className="text-primary">{userName}</span>!
          </h1>
          <p className="text-gray-400">Bienvenido a Zionary.</p>
        </div>
        <form action={handleLogout}>
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 mt-4 sm:mt-0">
              Cerrar Sesión
            </Button>
        </form>
      </header>

      <DashboardLayout>
        
        <Link href="/racks" className="contents">
          <KPICard title="Total de Racks" value={totalRacks} icon={Archive} iconClassName="text-sky-400" className="h-full" />
        </Link>
        
        <div className="lg:col-span-2 lg:row-span-2 h-full">
           <AIAssistantWidget />
        </div>
        
        <div className="flex flex-col gap-6 h-full">
            <Link href="/assets" className="contents">
                <KPICard title="Total de Activos" value={totalAssets} icon={HardDrive} iconClassName="text-blue-400" className="h-full" />
            </Link>
            <KPICard title="Activos Sin Asignar" value={unassignedAssets} icon={FileQuestion} iconClassName="text-rose-400" className="h-full" />
        </div>

        <Link href={fullestRackInfo.id ? `/racks/${fullestRackInfo.id}` : '#'} className="contents">
          <KPICard 
            title="Rack Más Lleno" 
            value={fullestRackInfo.name !== 'N/A' ? `${fullestRackInfo.name}: ${fullestRackInfo.occupancy_percentage}%` : 'N/A'} 
            icon={Container} 
            iconClassName="text-amber-400" 
            className="h-full"
          />
        </Link>
        
        <div className="lg:row-span-2 h-full">
          <ToDoListWidget />
        </div>
        
        <NetworkPortsProgressCard 
          totalPorts={networkPortsStats.total_ports}
          usedPorts={networkPortsStats.used_ports}
          className="lg:col-span-2 h-full" 
        />
        
        <Link href="/floor-plan" className="contents">
            <Card className="glassmorphic-card flex flex-col items-center justify-center p-6 text-center hover:border-purple-400/70 transition-all duration-300 ease-in-out h-full">
                <Map className="w-12 h-12 text-primary mb-4" />
                <h2 className="text-xl font-headline font-bold text-gray-50">Planos de Planta</h2>
                <p className="text-sm text-gray-400 mt-1">
                    Visualiza y gestiona la disposición física de tu infraestructura.
                </p>
            </Card>
        </Link>
        
      </DashboardLayout>
    </div>
  );
}
