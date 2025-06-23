'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SetupWizard } from './SetupWizard';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { Map, PlusCircle, AlertTriangle } from 'lucide-react';
import type { Database, Json } from '@/lib/database.types';

type Location = Pick<Database['public']['Tables']['Row'], 'id' | 'name'>;
type LocationDetails = Database['public']['Functions']['get_location_details']['Returns'][number] | null;

interface Rack {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  total_u: number;
}

interface FloorPlanViewProps {
  locations: Location[];
  selectedLocationId: string;
  locationDetails: LocationDetails;
  tenantId: string;
}

export function FloorPlanView({ locations, selectedLocationId, locationDetails, tenantId }: FloorPlanViewProps) {
  const router = useRouter();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleLocationChange = (locationId: string) => {
    router.push(`/floor-plan?location=${locationId}`);
  };

  const handleSetupComplete = () => {
    setIsWizardOpen(false);
    router.refresh();
  };
  
  const initialRacks: Rack[] = Array.isArray(locationDetails?.racks) ? locationDetails.racks : [];

  return (
    <div className="space-y-6">
      <Card className="glassmorphic-card">
        <CardHeader>
          <CardTitle>Seleccionar Ubicación</CardTitle>
          <CardDescription>Elige la ubicación para la cual deseas ver o configurar un plano de planta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleLocationChange} value={selectedLocationId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una ubicación..." />
            </SelectTrigger>
            <SelectContent>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {locationDetails ? (
        <div className="mt-6">
          {locationDetails.floor_plan_image_url ? (
            <FloorPlanCanvas 
              locationData={locationDetails}
              initialRacks={initialRacks}
              tenantId={tenantId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-purple-500/30 rounded-lg bg-gray-900/40">
                <Map className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-300">Sin Plano Configurado</h2>
                <p className="text-gray-400 mb-6">La ubicación "{locationDetails.name}" no tiene un plano de planta configurado.</p>
                <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="bg-primary hover:bg-primary/90 neon-glow-primary">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Configurar Plano de Planta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50 sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="font-headline text-2xl">Asistente de Configuración del Plano</DialogTitle>
                            <DialogDescription>
                                Sigue los pasos para subir, recortar y definir la cuadrícula de tu plano.
                            </DialogDescription>
                        </DialogHeader>
                        <SetupWizard 
                            locationId={selectedLocationId}
                            tenantId={tenantId}
                            onSetupComplete={handleSetupComplete}
                        />
                    </DialogContent>
                </Dialog>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-amber-500/30 rounded-lg bg-gray-900/40">
          <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-amber-300">Error al Cargar Detalles</h2>
          <p className="text-gray-400">No se pudieron cargar los detalles para la ubicación seleccionada.</p>
        </div>
      )}
    </div>
  );
}
