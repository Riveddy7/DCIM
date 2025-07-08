'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Zap, 
  Network, 
  Edit3, 
  Save, 
  X, 
  Activity, 
  MapPin,
  Hash,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RackDetails {
  id: string;
  name: string;
  total_u: number;
  pos_x: number | null;
  pos_y: number | null;
  notes: string | null;
  tenant_id: string;
  location_id: string;
  assets: Array<{
    id: string;
    name: string;
    asset_type: string | null;
    status: string | null;
    start_u: number | null;
    size_u: number | null;
    details: any;
  }>;
}

interface RackInfoPanelProps {
  rackId: string | null;
  onClose: () => void;
}

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/50',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  maintenance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  failed: 'bg-red-500/20 text-red-400 border-red-500/50',
};

const statusIcons = {
  active: CheckCircle,
  inactive: XCircle,
  maintenance: Clock,
  failed: AlertCircle,
};

export function RackInfoPanel({ rackId, onClose }: RackInfoPanelProps) {
  const [rackDetails, setRackDetails] = useState<RackDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    if (rackId) {
      fetchRackDetails();
    }
  }, [rackId]);

  const fetchRackDetails = async () => {
    if (!rackId) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('racks')
        .select(`
          *,
          assets:assets(
            id, name, asset_type, status, start_u, size_u, details
          )
        `)
        .eq('id', rackId)
        .single();

      if (error) throw error;
      
      setRackDetails(data);
      setEditForm({ name: data.name, notes: data.notes || '' });
    } catch (error) {
      console.error('Error fetching rack details:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los detalles del rack.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!rackId || !rackDetails) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('racks')
        .update({
          name: editForm.name,
          notes: editForm.notes,
        })
        .eq('id', rackId);

      if (error) throw error;
      
      setRackDetails(prev => prev ? { ...prev, name: editForm.name, notes: editForm.notes } : null);
      setIsEditing(false);
      
      toast({
        title: 'Guardado',
        description: 'Los cambios se guardaron correctamente.',
      });
    } catch (error) {
      console.error('Error saving rack changes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateRackUsage = () => {
    if (!rackDetails) return { used: 0, total: 0, percentage: 0 };
    
    const usedU = rackDetails.assets.reduce((sum, asset) => sum + (asset.size_u || 0), 0);
    const totalU = rackDetails.total_u;
    const percentage = totalU > 0 ? (usedU / totalU) * 100 : 0;
    
    return { used: usedU, total: totalU, percentage };
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusKey = status.toLowerCase() as keyof typeof statusColors;
    const color = statusColors[statusKey] || statusColors.inactive;
    const Icon = statusIcons[statusKey] || statusIcons.inactive;
    
    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', color)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (!rackId) {
    return (
      <Card className="glassmorphic-card border-purple-500/30 h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecciona un rack para ver sus detalles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glassmorphic-card border-purple-500/30 h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="font-headline text-lg"
                      placeholder="Nombre del rack"
                    />
                  </div>
                ) : (
                  <CardTitle className="font-headline text-lg text-purple-200">
                    {rackDetails?.name || 'Cargando...'}
                  </CardTitle>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : rackDetails ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Resumen</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="connections">Conexiones</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Posición
                      </Label>
                      <p className="text-sm font-mono">
                        {rackDetails.pos_x && rackDetails.pos_y
                          ? `(${rackDetails.pos_x}, ${rackDetails.pos_y})`
                          : 'Sin posición'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-400 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Tamaño
                      </Label>
                      <p className="text-sm font-mono">{rackDetails.total_u}U</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Uso del Rack
                    </Label>
                    <div className="space-y-1">
                      {(() => {
                        const { used, total, percentage } = calculateRackUsage();
                        return (
                          <>
                            <div className="flex justify-between text-sm">
                              <span>{used}U / {total}U</span>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Notas
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Agregar notas..."
                        className="min-h-[80px] resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-300 min-h-[80px] p-2 bg-gray-800/50 rounded border">
                        {rackDetails.notes || 'Sin notas'}
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="assets" className="space-y-3">
                  {rackDetails.assets.length > 0 ? (
                    <div className="space-y-2">
                      {rackDetails.assets.map((asset) => (
                        <motion.div
                          key={asset.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-gray-800/50 rounded border border-gray-700/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-purple-200">{asset.name}</h4>
                              <p className="text-xs text-gray-400 mt-1">
                                {asset.asset_type || 'Tipo no especificado'}
                              </p>
                              {asset.start_u && asset.size_u && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Posición: {asset.start_u}U - {asset.start_u + asset.size_u - 1}U
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(asset.status)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Server className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-sm text-gray-400">No hay assets en este rack</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="connections" className="space-y-3">
                  <div className="text-center py-6">
                    <Network className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm text-gray-400">Vista de conexiones próximamente</p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
                <p className="text-sm text-red-400">Error al cargar los detalles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}