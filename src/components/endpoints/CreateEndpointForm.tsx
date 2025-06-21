
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Cable, Package, Palette, Ruler } from 'lucide-react';
import type { Tables, PortDetails } from '@/lib/database.types';

type Location = Pick<Tables<'locations'>, 'id' | 'name'>;

interface CreateEndpointFormProps {
  tenantId: string;
  rearPortToConnect: PortDetails;
  locations: Location[];
  onSuccess: () => void;
  onCancel: () => void;
}

const endpointFormSchema = z.object({
  name: z.string().min(1, 'El nombre del punto de red es requerido.'),
  location_id: z.string().uuid('Debe seleccionar una ubicación válida.'),
  cable_brand: z.string().optional(),
  cable_color: z.string().optional(),
  cable_category: z.string().optional(),
  cable_length_m: z.coerce.number().optional().nullable(),
});

type EndpointFormValues = z.infer<typeof endpointFormSchema>;

export function CreateEndpointForm({ tenantId, rearPortToConnect, locations, onSuccess, onCancel }: CreateEndpointFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EndpointFormValues>({
    resolver: zodResolver(endpointFormSchema),
    defaultValues: {
      name: '',
      location_id: '',
      cable_brand: '',
      cable_color: 'Azul',
      cable_category: 'CAT6a',
      cable_length_m: null,
    },
  });

  async function onSubmit(values: EndpointFormValues) {
    setIsLoading(true);

    // 1. Create the ENDPOINT_USER asset
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .insert({
        tenant_id: tenantId,
        location_id: values.location_id,
        name: values.name,
        asset_type: 'ENDPOINT_USER',
        status: 'IN_PRODUCTION',
      })
      .select()
      .single();

    if (assetError || !assetData) {
      toast({ title: 'Error', description: `No se pudo crear el punto de red: ${assetError?.message}`, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // 2. Create the port for the new asset
    const { data: portData, error: portError } = await supabase
      .from('ports')
      .insert({
        tenant_id: tenantId,
        asset_id: assetData.id,
        name: 'Jack',
        port_type: 'RJ45'
      })
      .select()
      .single();
      
    if (portError || !portData) {
      toast({ title: 'Error', description: `No se pudo crear el puerto para el punto de red: ${portError?.message}`, variant: 'destructive' });
      // TODO: Consider rolling back asset creation
      setIsLoading(false);
      return;
    }

    // 3. Create the connection
    const cableDetails = {
        brand: values.cable_brand || null,
        color: values.cable_color || null,
        category: values.cable_category || null,
        length_m: values.cable_length_m || null,
    };

    const { error: connectionError } = await supabase
      .from('connections')
      .insert({
        port_a_id: rearPortToConnect.id,
        port_b_id: portData.id,
        tenant_id: tenantId,
        details: cableDetails,
      });

    if (connectionError) {
        toast({ title: 'Error', description: `No se pudo crear la conexión: ${connectionError.message}`, variant: 'destructive' });
        // TODO: Consider rolling back asset and port creation
        setIsLoading(false);
        return;
    }

    toast({ title: 'Éxito', description: `Punto de red "${values.name}" creado y conectado.` });
    setIsLoading(false);
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Nombre del Punto de Red (Faceplate ID)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: OFC-01-A, LAB-B2-04" {...field} className="bg-input border-purple-500/30 text-gray-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Ubicación Física</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-input border-purple-500/30 text-gray-300">
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name || 'Ubicación sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4 mt-4 border-t border-purple-500/20">
            <h3 className="font-semibold text-lg mb-4 flex items-center"><Cable className="mr-2 h-5 w-5 text-amber-400"/>Detalles del Cableado Horizontal</h3>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cable_brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 flex items-center"><Package className="mr-2 h-4 w-4"/>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Panduit" {...field} className="bg-input border-purple-500/30 text-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cable_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 flex items-center"><Palette className="mr-2 h-4 w-4"/>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Azul" {...field} className="bg-input border-purple-500/30 text-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cable_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 flex items-center"><Cable className="mr-2 h-4 w-4"/>Categoría</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: CAT6A" {...field} className="bg-input border-purple-500/30 text-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cable_length_m"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 flex items-center"><Ruler className="mr-2 h-4 w-4"/>Longitud (m)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ej: 25.5" {...field} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} value={field.value ?? ''} className="bg-input border-purple-500/30 text-gray-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear y Conectar
          </Button>
        </div>
      </form>
    </Form>
  );
}

