
// TODO: Implement asset management page
// This is a placeholder page for asset management.
// Functionality similar to the Racks page will be implemented here.
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Loader2 } from 'lucide-react'; // Assuming Loader2 might be used for loading states later
import { useState, useEffect } from 'react';

export default function AssetsPage() {
  const [isLoading, setIsLoading] = useState(true); // Example loading state

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 flex justify-center items-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            Gestión de Activos
          </h1>
          <Link href="/dashboard">
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
        {/* Placeholder for filters and actions */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          Search, filters, create button will go here
        </div> */}
      </header>

      <div className="glassmorphic-card p-6">
        <p className="text-center text-gray-300">
          Página de Gestión de Activos - Contenido Próximamente.
        </p>
        <p className="text-center text-gray-400 text-sm mt-2">
          Aquí se mostrará una lista de todos los activos, con opciones para filtrar, buscar y crear nuevos activos.
        </p>
      </div>
      
      {/* Placeholder for asset list/cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        Asset cards will be displayed here
      </div> */}
    </div>
  );
}
