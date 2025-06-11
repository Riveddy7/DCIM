
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface RackDetailPageProps {
  params: { id: string };
}

export default async function RackDetailPage({ params }: RackDetailPageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch specific rack details here if needed for this page in the future
  // For now, just displaying the ID.
  const rackId = params.id;

  // Example: Fetch rack data by ID
  // const { data: rack, error } = await supabase
  //   .from('racks')
  //   .select('*')
  //   .eq('id', rackId)
  //   .eq('tenant_id', user.id)
  //   .single();

  // if (error || !rack) {
  //   console.error('Error fetching rack details or rack not found:', error?.message);
  //   // redirect('/racks'); // or show a not found message
  // }


  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            Rack Details: <span className="text-primary">{rackId}</span>
          </h1>
          {/* If rack data is fetched: <h1 className="text-3xl font-bold font-headline text-gray-50">{rack.name || 'Rack Details'}</h1> */}
          <p className="text-gray-400">Manage assets and configuration for this rack.</p>
        </div>
        <Link href="/racks">
          <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Racks List
          </Button>
        </Link>
      </header>
      
      <div className="glassmorphic-card p-6">
        <p className="text-gray-300">Detailed information for rack with ID: <span className="font-semibold text-primary">{rackId}</span> will be displayed here.</p>
        {/* 
          Placeholder for future content:
          - Rack visualization
          - List of assets in this rack
          - Power and network information
          - Edit/Delete rack options
        */}
      </div>
    </div>
  );
}
