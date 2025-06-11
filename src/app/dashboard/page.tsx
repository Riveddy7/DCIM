import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BarChart3, HardDrive, Network, Users, Power, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPI_Card';
import { AIAssistantWidget } from '@/components/dashboard/AI_Assistant_Widget';
import { DonutChartWidget } from '@/components/dashboard/Donut_Chart_Widget';
import { ToDoListWidget } from '@/components/dashboard/ToDo_List_Widget';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Dummy data for charts - replace with actual data fetching
const serverStatusData = [
  { name: 'Online', value: 180, fill: 'hsl(var(--primary))' }, // purple
  { name: 'Warning', value: 15, fill: 'hsl(48,96%,59%)' }, // yellow
  { name: 'Offline', value: 5, fill: 'hsl(var(--destructive))' }, // red
];

const storageCapacityData = [
  { name: 'Usado', value: 750, fill: 'hsl(var(--secondary))' }, // cyan
  { name: 'Libre', value: 250, fill: 'hsl(var(--muted))' }, // gray
];


export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile or name - assuming user_metadata.full_name or a profiles table
  // For simplicity, using email if full_name is not available
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';

  // Placeholder KPI data - replace with actual Supabase calls
  const kpiData = {
    activeRacks: Math.floor(Math.random() * 100) + 50,
    totalAssets: Math.floor(Math.random() * 1000) + 500,
    networkPorts: Math.floor(Math.random() * 5000) + 1000,
    powerConsumption: Math.floor(Math.random() * 200) + 50, // kW
    activeAlerts: Math.floor(Math.random() * 10),
    teamMembers: Math.floor(Math.random() * 20) + 5,
  };
  
  const handleLogout = async () => {
    "use server";
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            Hola, <span className="text-primary">{userName}</span>!
          </h1>
          <p className="text-gray-400">Bienvenido a Visión Latina DCIM.</p>
        </div>
        <form action={handleLogout}>
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 mt-4 sm:mt-0">
              Cerrar Sesión
            </Button>
        </form>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Main AI Assistant Widget - Spanning more columns on larger screens */}
        <div className="md:col-span-2 lg:col-span-2 lg:row-span-2">
           <AIAssistantWidget />
        </div>

        {/* KPI Cards */}
        <KPICard title="Racks Activos" value={kpiData.activeRacks} icon={BarChart3} iconClassName="text-green-400" />
        <KPICard title="Activos Totales" value={kpiData.totalAssets} icon={HardDrive} iconClassName="text-blue-400" />
        
        {/* Charts - could be single column on md, then move around */}
        <div className="md:col-span-1 lg:col-span-2">
          <DonutChartWidget data={serverStatusData} title="Estado de Servidores" />
        </div>

        <KPICard title="Puertos de Red" value={kpiData.networkPorts} icon={Network} iconClassName="text-cyan-400" />
        <KPICard title="Consumo (kW)" value={`${kpiData.powerConsumption} kW`} icon={Power} iconClassName="text-orange-400" />
        
        <div className="md:col-span-2 lg:col-span-2">
          <DonutChartWidget data={storageCapacityData} title="Capacidad de Almacenamiento (TB)" description="Total: 1000 TB"/>
        </div>
        
        <KPICard title="Alertas Activas" value={kpiData.activeAlerts} icon={AlertTriangle} iconClassName="text-red-500" />
        <KPICard title="Miembros del Equipo" value={kpiData.teamMembers} icon={Users} iconClassName="text-indigo-400" />
        
        {/* To-Do List - could span more width */}
        <div className="md:col-span-3 lg:col-span-4">
          <ToDoListWidget />
        </div>
      </div>
    </div>
  );
}
