
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SetupWizard } from './SetupWizard';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { Map, PlusCircle, AlertTriangle, Loader2, Pencil, Eye } from 'lucide-react';
import type { Database } from '@/lib/database.types';

// El tipo que devuelve nuestra RPC completa
type LocationDetails = Database['public']['Functions']['get_location_details']['Returns'];

// Definimos un tipo más simple para los racks para mayor claridad
interface Rack {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  total_u: number;
}

interface FloorPlanViewProps {
  locationDetails: LocationDetails | null; // Puede ser null si la carga falla
  tenantId: string;
}

export function FloorPlanView({ locationDetails, tenantId }: FloorPlanViewProps) {
  const router = useRouter();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSetupComplete = () => {
    setIsWizardOpen(false);
    setIsProcessing(true);
    
    setTimeout(() => {
      router.refresh();
      // No necesitamos setIsProcessing(false) porque la página se recargará por completo
    }, 4000);
  };
  
  const initialRacks: Rack[] = locationDetails?.racks && Array.isArray(locationDetails.racks) 
    ? locationDetails.racks 
    : [];

  const locationData = locationDetails?.location;

  return (
    <div className="space-y-6">
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <p className="text-xl text-gray-200 mt-4">Procesando tu plano...</p>
          <p className="text-sm text-gray-400 mt-1">La página se actualizará automáticamente.</p>
        </div>
      )}

      {locationData ? (
        <div className="mt-2">
          {locationData.floor_plan_image_url ? (
            <>
              <div className="flex justify-end mb-4">
                  <Button onClick={() => setIsEditMode(prev => !prev)} variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                      {isEditMode ? <Eye className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                      {isEditMode ? 'Finalizar Edición' : 'Editar Plano'}
                  </Button>
              </div>
              <FloorPlanCanvas 
                locationData={locationData}
                initialRacks={initialRacks}
                tenantId={tenantId}
                isEditMode={isEditMode}
                onRacksUpdate={() => router.refresh()}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-purple-500/30 rounded-lg bg-gray-900/40">
                <Map className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-300">Sin Plano Configurado</h2>
                <p className="text-gray-400 mb-6">La ubicación "{locationData.name}" no tiene un plano de planta configurado.</p>
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
                            locationId={locationData.id}
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
