'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Network, CircuitBoard, Cable, HardDrive } from 'lucide-react';
import type { Tables, PortDetails, TablesInsert } from '@/lib/database.types';
import { deviceSchemas, getDeviceTypeOptions } from '@/lib/device-schemas';
import type { FieldDefinition } from '@/lib/asset-schemas';

type Location = Pick<Tables<'locations'>, 'id' | 'name'>;

interface CreateEndpointWizardProps {
  tenantId: string;
  rearPortToConnect: PortDetails;
  locations: Location[];
  onSuccess: () => void;
  onCancel: () => void;
}

const wizardSchema = z.object({
  // Step 1
  endpointName: z.string().min(1, 'El nombre del punto de red es requerido.'),
  endpointLocationId: z.string().uuid('Debe seleccionar una ubicación válida.'),
  jackBrand: z.string().optional(),
  jackCategory: z.string().optional(),
  jackColor: z.string().optional(),
  
  // Step 2
  connectionChoice: z.enum(['empty', 'connect_new']).default('empty'),

  // Step 3 (Device)
  deviceName: z.string().optional(),
  deviceType: z.string().optional(),

  // Step 3 (Patch Cord)
  patchCordBrand: z.string().optional(),
  patchCordColor: z.string().optional(),
  patchCordCategory: z.string().optional(),
  patchCordLengthM: z.coerce.number().optional().nullable(),
});

type WizardFormValues = z.infer<typeof wizardSchema> & { [key: string]: any };

export function CreateEndpointWizard({ tenantId, rearPortToConnect, locations, onSuccess, onCancel }: CreateEndpointWizardProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentDynamicSchema, setCurrentDynamicSchema] = useState<FieldDefinition[]>([]);

  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      endpointName: '',
      endpointLocationId: '',
      jackBrand: '',
      jackCategory: 'CAT6a',
      jackColor: 'Blanco',
      connectionChoice: 'empty',
      deviceType: '',
    },
  });

  const connectionChoice = form.watch('connectionChoice');
  const watchedDeviceType = form.watch('deviceType');

  useEffect(() => {
    if (watchedDeviceType && deviceSchemas[watchedDeviceType]) {
      setCurrentDynamicSchema(deviceSchemas[watchedDeviceType]);
    } else {
      setCurrentDynamicSchema([]);
    }
  }, [watchedDeviceType]);

  async function onSubmit(values: WizardFormValues) {
    setIsLoading(true);
    try {
        // Step 1: Create Endpoint Asset (the jack/faceplate)
        const endpointDetails = {
            brand: values.jackBrand,
            category: values.jackCategory,
            color: values.jackColor,
        };
        const { data: endpointAsset, error: endpointAssetError } = await supabase
            .from('assets')
            .insert({
                tenant_id: tenantId,
                location_id: values.endpointLocationId,
                name: values.endpointName,
                asset_type: 'ENDPOINT_USER',
                status: 'IN_PRODUCTION',
                details: endpointDetails,
            })
            .select()
            .single();

        if (endpointAssetError) throw new Error(`Error creando el punto de red: ${endpointAssetError.message}`);

        // Step 2: Create Port for the Endpoint Asset
        const { data: endpointPort, error: endpointPortError } = await supabase
            .from('ports')
            .insert({ tenant_id: tenantId, asset_id: endpointAsset.id, name: 'Jack', port_type: 'RJ45' })
            .select()
            .single();
        
        if (endpointPortError) throw new Error(`Error creando el puerto del punto de red: ${endpointPortError.message}`);

        // Step 3: Create Horizontal Cable Connection (Patch Panel Rear -> Endpoint Jack)
        // For now, details for horizontal cable are not in the form, can be added later
        const { error: horizontalConnectionError } = await supabase
            .from('connections')
            .insert({ port_a_id: rearPortToConnect.id, port_b_id: endpointPort.id, tenant_id: tenantId });
        
        if (horizontalConnectionError) throw new Error(`Error creando la conexión horizontal: ${horizontalConnectionError.message}`);

        if (values.connectionChoice === 'connect_new') {
            // Step 4: Create the new device asset
            if (!values.deviceName || !values.deviceType) {
              throw new Error('El nombre y tipo de dispositivo son requeridos para crear una conexión.');
            }
            
            const deviceDetails: Record<string, any> = {};
            currentDynamicSchema.forEach(fieldDef => {
                const value = values[fieldDef.name];
                if (value !== undefined && value !== null && value !== '') {
                    deviceDetails[fieldDef.name] = value;
                }
            });

            const deviceAssetData: TablesInsert<'assets'> = {
                tenant_id: tenantId,
                location_id: values.endpointLocationId,
                name: values.deviceName,
                asset_type: values.deviceType,
                status: 'IN_PRODUCTION',
                details: Object.keys(deviceDetails).length > 0 ? deviceDetails : null,
            };
            
            const { data: deviceAsset, error: deviceAssetError } = await supabase
                .from('assets')
                .insert(deviceAssetData)
                .select()
                .single();

            if (deviceAssetError) throw new Error(`Error creando el dispositivo: ${deviceAssetError.message}`);

            // Step 5: Create port for the new device
            const { data: devicePort, error: devicePortError } = await supabase
                .from('ports')
                .insert({ tenant_id: tenantId, asset_id: deviceAsset.id, name: 'eth0', port_type: 'RJ45' })
                .select()
                .single();
            
            if (devicePortError) throw new Error(`Error creando el puerto del dispositivo: ${devicePortError.message}`);

            // Step 6: Create Patch Cord Connection (Endpoint Jack -> Device Port)
            const patchCordDetails = {
                brand: values.patchCordBrand,
                color: values.patchCordColor,
                category: values.patchCordCategory,
                length_m: values.patchCordLengthM
            };
            const { error: patchCordConnectionError } = await supabase
                .from('connections')
                .insert({ port_a_id: endpointPort.id, port_b_id: devicePort.id, tenant_id: tenantId, details: patchCordDetails });
            
            if (patchCordConnectionError) throw new Error(`Error creando la conexión del patch cord: ${patchCordConnectionError.message}`);
        }

        toast({ title: 'Éxito', description: 'Punto de red y conexiones creadas correctamente.' });
        onSuccess();
    } catch (error: any) {
        toast({ title: 'Error en el Proceso', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        
        {/* Step 1: Endpoint Definition */}
        <section>
          <h3 className="font-semibold text-lg mb-4 flex items-center"><Network className="mr-2 h-5 w-5 text-sky-400"/>1. Definir Punto de Red (Jack/Faceplate)</h3>
          <div className="space-y-4 p-4 border rounded-md bg-input/20 border-purple-500/20">
            <FormField control={form.control} name="endpointName" render={({ field }) => (
              <FormItem>
                <FormLabel>ID del Punto de Red</FormLabel>
                <FormControl><Input placeholder="Ej: OFC-01-A, LAB-B2-04" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="endpointLocationId" render={({ field }) => (
              <FormItem>
                <FormLabel>Ubicación Física del Punto de Red</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecciona una ubicación" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </section>

        {/* Step 2: Connection Choice */}
        <section>
          <h3 className="font-semibold text-lg mb-2 flex items-center"><Cable className="mr-2 h-5 w-5 text-amber-400"/>2. Conexión del Puerto</h3>
          <FormField control={form.control} name="connectionChoice" render={({ field }) => (
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
              <Label className="flex items-center gap-2 p-4 border rounded-md cursor-pointer has-[:checked]:bg-primary/20 has-[:checked]:border-primary flex-1">
                <RadioGroupItem value="empty" id="r1" /> Dejar puerto del jack libre
              </Label>
              <Label className="flex items-center gap-2 p-4 border rounded-md cursor-pointer has-[:checked]:bg-primary/20 has-[:checked]:border-primary flex-1">
                <RadioGroupItem value="connect_new" id="r2" /> Añadir y conectar un nuevo dispositivo
              </Label>
            </RadioGroup>
          )} />
        </section>

        {/* Step 3: Device Definition (Conditional) */}
        {connectionChoice === 'connect_new' && (
          <section>
            <h3 className="font-semibold text-lg mb-4 flex items-center"><HardDrive className="mr-2 h-5 w-5 text-lime-400"/>3. Definir Nuevo Dispositivo</h3>
             <div className="space-y-4 p-4 border rounded-md bg-input/20 border-purple-500/20">
                <FormField control={form.control} name="deviceName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Dispositivo</FormLabel>
                    <FormControl><Input placeholder="Ej: Cámara Vestíbulo, Teléfono Recepción" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deviceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Dispositivo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>{getDeviceTypeOptions().map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {currentDynamicSchema.map((fieldDef) => (
                    <FormField key={fieldDef.name} control={form.control} name={fieldDef.name} render={({ field }) => (
                        <FormItem>
                            <FormLabel>{fieldDef.label}</FormLabel>
                            <FormControl><Input placeholder={fieldDef.placeholder} {...field} type={fieldDef.type} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                ))}

                <Separator className="my-6" />
                <h4 className="font-semibold text-md mb-4">Detalles del Patch Cord (Jack a Dispositivo)</h4>
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField control={form.control} name="patchCordBrand" render={({ field }) => (<FormItem><FormLabel>Marca</FormLabel><FormControl><Input placeholder="Marca" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="patchCordColor" render={({ field }) => (<FormItem><FormLabel>Color</FormLabel><FormControl><Input placeholder="Color" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="patchCordCategory" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><FormControl><Input placeholder="CAT6a" {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="patchCordLengthM" render={({ field }) => (<FormItem><FormLabel>Longitud (m)</FormLabel><FormControl><Input type="number" placeholder="1.5" {...field} /></FormControl></FormItem>)} />
                 </div>
             </div>
          </section>
        )}
        
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar y Crear
          </Button>
        </div>
      </form>
    </Form>
  );
}
