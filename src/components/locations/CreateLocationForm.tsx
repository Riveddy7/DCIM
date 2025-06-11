
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type ExistingLocation = Pick<Database['public']['Tables']['locations']['Row'], 'id' | 'name'>;

interface CreateLocationFormProps {
  existingLocations: ExistingLocation[];
  tenantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const locationFormSchema = z.object({
  name: z.string().min(1, 'El nombre de la ubicación es requerido.'),
  parent_location_id: z.string().optional().nullable().transform(val => (val === '' || val === 'NONE') ? null : val),
  description: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

export function CreateLocationForm({ existingLocations, tenantId, onSuccess, onCancel }: CreateLocationFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: '',
      parent_location_id: 'NONE', // Default to "Ninguna"
      description: '',
    },
  });

  async function onSubmit(values: LocationFormValues) {
    setIsLoading(true);
    
    const newLocationObject = {
      name: values.name,
      parent_location_id: values.parent_location_id,
      description: values.description,
      tenant_id: tenantId,
    };

    const { error } = await supabase.from('locations').insert([newLocationObject]);

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error al crear la ubicación',
        description: error.message || 'Ocurrió un problema al guardar la ubicación.',
        variant: 'destructive',
      });
      console.error('Error inserting location:', error);
    } else {
      toast({
        title: 'Ubicación Creada',
        description: `La ubicación "${values.name}" ha sido creada exitosamente.`,
      });
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Nombre de la Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Planta Guadalajara, IDF-Comunicaciones" {...field} className="bg-input border-purple-500/30 text-gray-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parent_location_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Ubicación Padre (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || 'NONE'}>
                <FormControl>
                  <SelectTrigger className="bg-input border-purple-500/30 text-gray-300">
                    <SelectValue placeholder="Selecciona una ubicación padre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                  <SelectItem value="NONE">Ninguna (Ubicación Principal)</SelectItem>
                  {existingLocations.map((location) => (
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
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ej: Cuarto de servidores en el ala oeste del edificio 3." 
                  {...field} 
                  className="bg-input border-purple-500/30 text-gray-50" 
                  rows={3}
                />
              </FormControl>
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
            Crear Ubicación
          </Button>
        </div>
      </form>
    </Form>
  );
}
