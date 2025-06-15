
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { TablesInsert } from '@/lib/database.types';

const assetFormSchema = z.object({
  name: z.string().min(1, 'El nombre del activo es requerido.'),
  asset_type: z.string().optional(),
  status: z.string().optional(),
  size_u: z.coerce.number().int().min(1, 'El tamaño debe ser al menos 1U.'),
  details: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true; // Allow empty string
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: 'Debe ser un JSON válido o estar vacío.' }),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface CreateAssetFormProps {
  tenantId: string;
  rackId: string;
  rackLocationId: string;
  startU: number;
  onAssetCreateSuccess: () => void;
  onCancel: () => void;
}

export function CreateAssetForm({
  tenantId,
  rackId,
  rackLocationId,
  startU,
  onAssetCreateSuccess,
  onCancel,
}: CreateAssetFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      asset_type: '',
      status: 'IN_PRODUCTION', // Default status
      size_u: 1,
      details: '{}', // Default to empty JSON object string
    },
  });

  async function onSubmit(values: AssetFormValues) {
    setIsLoading(true);

    let parsedDetails: any = null;
    if (values.details && values.details.trim() !== '') {
        try {
            parsedDetails = JSON.parse(values.details);
        } catch (error) {
            toast({
                title: 'Error en JSON',
                description: 'El campo de detalles adicionales no es un JSON válido.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }
    }


    const newAssetData: TablesInsert<'assets'> = {
      tenant_id: tenantId,
      rack_id: rackId,
      location_id: rackLocationId,
      name: values.name,
      asset_type: values.asset_type || null,
      status: values.status || null,
      start_u: startU,
      size_u: values.size_u,
      details: parsedDetails,
    };

    const { error } = await supabase.from('assets').insert([newAssetData]);

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error al crear activo',
        description: error.message || 'Ocurrió un problema al guardar el activo.',
        variant: 'destructive',
      });
      console.error('Error inserting asset:', error);
    } else {
      toast({
        title: 'Activo Creado',
        description: `El activo "${values.name}" ha sido creado exitosamente.`,
      });
      onAssetCreateSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Nombre del Activo</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Servidor Web 01" {...field} className="bg-input border-purple-500/30 text-gray-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="size_u"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Tamaño (U)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} className="bg-input border-purple-500/30 text-gray-50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormItem>
             <FormLabel className="text-gray-300">U de Inicio</FormLabel>
             <Input type="number" value={startU} disabled className="bg-input border-purple-500/30 text-gray-400" />
             <FormDescription className="text-xs text-gray-500">Determinado por el slot seleccionado.</FormDescription>
           </FormItem>
        </div>

        <FormField
          control={form.control}
          name="asset_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Tipo de Activo (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: SERVER, SWITCH" {...field} className="bg-input border-purple-500/30 text-gray-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Estado (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: IN_PRODUCTION" {...field} className="bg-input border-purple-500/30 text-gray-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Detalles Adicionales (JSON, Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder='{ "serial_number": "XYZ123", "ip_address": "192.168.1.10" }'
                  {...field} 
                  className="bg-input border-purple-500/30 text-gray-50 font-mono text-xs" 
                  rows={4}
                />
              </FormControl>
              <FormDescription className="text-xs text-gray-500">Ingresa un objeto JSON válido.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Añadir Activo
          </Button>
        </div>
      </form>
    </Form>
  );
}

    