
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { SetupWizard } from './SetupWizard';
import { FloorPlanCanvas } from './FloorPlanCanvas';
import { FloorPlanThemes, ThemeType } from './FloorPlanThemes';
import { FloorPlanExport } from './FloorPlanExport';
import { Map, PlusCircle, AlertTriangle, Loader2, Pencil, Eye, Home, Building, Palette, Download, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Database } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

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

interface Endpoint {
  id: string;
  name: string;
  pos_x: number | null;
  pos_y: number | null;
  rack_id?: string | null;
  asset_type: string;
  status: string;
}

interface FloorPlanViewProps {
  locationDetails: LocationDetails | null; // Puede ser null si la carga falla
  tenantId: string;
}

export function FloorPlanView({ locationDetails, tenantId }: FloorPlanViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('default');
  const [showSidePanels, setShowSidePanels] = useState(false);
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);
  const [showImageTools, setShowImageTools] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleSetupComplete = () => {
    setIsWizardOpen(false);
    setIsProcessing(true);
    
    setTimeout(() => {
      router.refresh();
      // No necesitamos setIsProcessing(false) porque la página se recargará por completo
    }, 4000);
  };

  const fetchEndpoints = async () => {
    try {
      setIsLoadingEndpoints(true);
      
      // Get all assets of type ENDPOINT_USER for this tenant
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, asset_type, status, details, location_id')
        .eq('tenant_id', tenantId)
        .eq('asset_type', 'ENDPOINT_USER');

      if (assetsError) {
        console.error('Error fetching endpoints:', assetsError);
        return;
      }

      // Transform the assets data into our Endpoint interface
      const endpointsData: Endpoint[] = (assetsData || []).map(asset => ({
        id: asset.id,
        name: asset.name || '',
        pos_x: (asset.details as any)?.pos_x || null,
        pos_y: (asset.details as any)?.pos_y || null,
        rack_id: null, // We could add rack relationship logic here later
        asset_type: asset.asset_type || 'ENDPOINT_USER',
        status: asset.status || 'UNKNOWN'
      }));

      setEndpoints(endpointsData);
    } catch (error) {
      console.error('Error in fetchEndpoints:', error);
    } finally {
      setIsLoadingEndpoints(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchEndpoints();
    }
  }, [tenantId]);

  const handleEndpointsUpdate = () => {
    fetchEndpoints();
  };
  
  const initialRacks: Rack[] = locationDetails?.racks && Array.isArray(locationDetails.racks) 
    ? locationDetails.racks 
    : [];

  const locationData = locationDetails?.location;

  return (
    <div className="space-y-4 lg:space-y-6 px-2 sm:px-4 lg:px-6">
      {/* Breadcrumb Navigation */}
      <div className="hidden sm:block">
        <Breadcrumb>
          <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/locations" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Ubicaciones
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              {locationData?.name || 'Plano de Planta'}
            </BreadcrumbPage>
          </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      {/* Mobile back button */}
      <div className="sm:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
        >
          <Home className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <p className="text-xl text-gray-200 mt-4">Procesando tu plano...</p>
              <p className="text-sm text-gray-400 mt-1">La página se actualizará automáticamente.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {locationData ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-2"
        >
          {locationData.floor_plan_image_url ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl lg:text-2xl font-headline text-purple-200 sm:hidden">
                  {locationData.name}
                </h1>
                <div className="flex items-center gap-2 ml-auto">
                  {/* Theme & Export Toggle */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      onClick={() => setShowSidePanels(!showSidePanels)}
                      variant="outline" 
                      size="sm"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-all duration-200"
                    >
                      {showSidePanels ? (
                        <>
                          <Eye className="mr-1 h-4 w-4" />
                          <span className="hidden sm:inline">Ocultar Herramientas</span>
                          <span className="sm:hidden">Ocultar</span>
                        </>
                      ) : (
                        <>
                          <Palette className="mr-1 h-4 w-4" />
                          <span className="hidden sm:inline">Herramientas</span>
                          <span className="sm:hidden">Herram.</span>
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Edit Mode Toggle */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      onClick={() => setIsEditMode(prev => !prev)} 
                      variant="outline" 
                      size="sm"
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-all duration-200"
                    >
                        {isEditMode ? <Eye className="mr-1 sm:mr-2 h-4 w-4" /> : <Pencil className="mr-1 sm:mr-2 h-4 w-4" />}
                        <span className="hidden sm:inline">
                          {isEditMode ? 'Finalizar Edición' : 'Editar Plano'}
                        </span>
                        <span className="sm:hidden">
                          {isEditMode ? 'Finalizar' : 'Editar'}
                        </span>
                    </Button>
                  </motion.div>

                  {/* Image Tools Toggle (only visible in edit mode) */}
                  {isEditMode && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Button 
                        onClick={() => setShowImageTools(prev => !prev)} 
                        variant="outline" 
                        size="sm"
                        className={cn(
                          "border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-200",
                          showImageTools && "bg-blue-500/20 border-blue-400"
                        )}
                      >
                          <Settings className="mr-1 sm:mr-2 h-4 w-4" />
                          <span className="hidden sm:inline">
                            {showImageTools ? 'Ocultar Ajustes' : 'Ajustar Imagen'}
                          </span>
                          <span className="sm:hidden">
                            {showImageTools ? 'Ocultar' : 'Ajustar'}
                          </span>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
              <div className="flex flex-col xl:flex-row gap-6">
                {/* Main Canvas */}
                <div ref={canvasRef} className="flex-1">
                  <FloorPlanCanvas 
                    locationData={locationData}
                    initialRacks={initialRacks}
                    initialEndpoints={endpoints}
                    tenantId={tenantId}
                    isEditMode={isEditMode}
                    currentTheme={currentTheme}
                    showImageTools={showImageTools}
                    onRacksUpdate={() => router.refresh()}
                    onEndpointsUpdate={handleEndpointsUpdate}
                    onToggleImageTools={() => setShowImageTools(prev => !prev)}
                  />
                </div>

                {/* Side Panels */}
                <AnimatePresence>
                  {showSidePanels && !isEditMode && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full xl:w-80 space-y-4"
                    >
                      {/* Themes Panel */}
                      <FloorPlanThemes
                        currentTheme={currentTheme}
                        onThemeChange={setCurrentTheme}
                      />

                      {/* Export Panel */}
                      <FloorPlanExport
                        canvasRef={canvasRef}
                        locationName={locationData.name}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-purple-500/30 rounded-lg bg-gray-900/40"
            >
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Map className="w-16 h-16 text-gray-500 mb-4" />
                </motion.div>
                <h2 className="text-xl font-bold text-gray-300">Sin Plano Configurado</h2>
                <p className="text-gray-400 mb-6">La ubicación "{locationData.name}" no tiene un plano de planta configurado.</p>
                <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
                    <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button size="lg" className="bg-primary hover:bg-primary/90 neon-glow-primary transition-all duration-200">
                              <PlusCircle className="mr-2 h-5 w-5" />
                              Configurar Plano de Planta
                          </Button>
                        </motion.div>
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
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-amber-500/30 rounded-lg bg-gray-900/40"
        >
          <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-amber-300">Error al Cargar Detalles</h2>
          <p className="text-gray-400">No se pudieron cargar los detalles para la ubicación seleccionada.</p>
        </motion.div>
      )}
    </div>
  );
}
