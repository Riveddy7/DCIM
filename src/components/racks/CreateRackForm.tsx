
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Location = Database['public']['Tables']['locations']['Row'];

interface CreateRackFormProps {
  locations: Location[];
  tenantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const rackFormSchema = z.object({
  name: z.string().min(1, 'El nombre del rack es requerido.'),
  location_id: z.string().uuid('Debe seleccionar una ubicación válida.'),
  total_u: z.coerce.number().int().positive('El total de UR debe ser un número positivo.'),
  notes: z.string().optional(),
});

type RackFormValues = z.infer<typeof rackFormSchema>;

export function CreateRackForm({ locations, tenantId, onSuccess, onCancel }: CreateRackFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RackFormValues>({
    resolver: zodResolver(rackFormSchema),
    defaultValues: {
      name: '',
      location_id: '',
      total_u: 42, // Default U
      notes: '',
    },
  });

  async function onSubmit(values: RackFormValues) {
    setIsLoading(true);
    const newRackObject = {
      ...values,
      tenant_id: tenantId,
    };

    const { error } = await supabase.from('racks').insert([newRackObject]);

    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error al crear el rack',
        description: error.message || 'Ocurrió un problema al guardar el rack.',
        variant: 'destructive',
      });
      console.error('Error inserting rack:', error);
    } else {
      toast({
        title: 'Rack Creado',
        description: `El rack "${values.name}" ha sido creado exitosamente.`,
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
              <FormLabel className="text-gray-300">Nombre del Rack</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Rack Principal A01" {...field} className="bg-input border-purple-500/30 text-gray-50" />
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
              <FormLabel className="text-gray-300">Ubicación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-input border-purple-500/30 text-gray-300">
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                  {locations.length === 0 && <SelectItem value="no-locations" disabled>No hay ubicaciones disponibles</SelectItem>}
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
        
        <FormField
          control={form.control}
          name="total_u"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Total de Unidades de Rack (UR)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ej: 42" {...field} className="bg-input border-purple-500/30 text-gray-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Descripción (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Rack de servidores principales" {...field} className="bg-input border-purple-500/30 text-gray-50" />
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
            Crear Rack
          </Button>
        </div>
      </form>
    </Form>
  );
}

    
