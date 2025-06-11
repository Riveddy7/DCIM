
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RackCard } from '@/components/racks/RackCard';
import { PlusCircle, Search, LayoutDashboard, ListFilter, MapPin } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type RackOverview = Database['public']['Functions']['get_racks_overview']['Returns'][number];

export default async function RacksPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: racksData, error: racksError } = await supabase
    .rpc('get_racks_overview', { tenant_id_param: user.id });

  if (racksError) {
    console.error('Error fetching racks overview:', racksError.message);
    // Handle error display appropriately, maybe a toast or a message on the page
  }
  
  const racks: RackOverview[] = racksData || [];

  // Placeholder data for filters
  const locations = racks && racks.length > 0 ? [...new Set(racks.map(r => r.location).filter(Boolean))] : ["All Locations"];
  const statuses = racks && racks.length > 0 ? [...new Set(racks.map(r => r.status).filter(Boolean))] : ["All Statuses"];


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
                {statuses.map(status => (
                  <SelectItem key={status} value={status?.toLowerCase() || 'unknown'}>{status || 'Unknown'}</SelectItem>
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
                 {locations.map(location => (
                  <SelectItem key={location} value={location?.toLowerCase() || 'unknown'}>{location || 'N/A'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
        </div>
        <div className="mt-4 flex justify-end">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Rack
            </Button>
          </div>
      </header>

      {racksError && (
        <div className="text-center text-destructive-foreground bg-destructive/80 p-4 rounded-md">
          <p>Could not load rack data. Please ensure the database is set up correctly and the 'get_racks_overview' RPC function exists.</p>
          <p className="text-xs mt-1">{racksError.message}</p>
        </div>
      )}

      {!racksError && racks.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          <p className="text-xl">No racks found.</p>
          <p>Get started by creating a new rack.</p>
        </div>
      )}

      {!racksError && racks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {racks.map((rack) => (
            <RackCard key={rack.id} rack={rack} />
          ))}
        </div>
      )}
    </div>
  );
}
