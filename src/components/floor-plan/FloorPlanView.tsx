
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SetupWizard } from './SetupWizard';
import { Map, PlusCircle } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Location = Pick<Database['public']['Tables']['locations']['Row'], 'id' | 'name'>;

interface FloorPlanViewProps {
  locations: Location[];
  tenantId: string;
}

export function FloorPlanView({ locations, tenantId }: FloorPlanViewProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const handleSetupComplete = () => {
    setIsWizardOpen(false);
    // Here you would typically refetch the data for the floor plan
    // For now, we just close the modal.
    alert('¡Configuración guardada! La visualización del plano se implementará en el siguiente paso.');
  };

  return (
    <div className="space-y-6">
      <Card className="glassmorphic-card max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Seleccionar Ubicación</CardTitle>
          <CardDescription>Elige la ubicación para la cual deseas ver o configurar un plano de planta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedLocationId} value={selectedLocationId || undefined}>
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

      {selectedLocationId && (
        <div className="mt-8 text-center">
            {/* This is where the actual floor plan would be rendered if it exists. */}
            {/* For now, we show the setup button. */}
             <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-purple-500/30 rounded-lg bg-gray-900/40">
                <Map className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-300">Sin Plano Configurado</h2>
                <p className="text-gray-400 mb-6">La ubicación "{selectedLocation?.name}" no tiene un plano de planta configurado.</p>
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
                            onSetupComplete={handleSetupComplete}
                        />
                    </DialogContent>
                 </Dialog>
            </div>
        </div>
      )}
    </div>
  );
}
