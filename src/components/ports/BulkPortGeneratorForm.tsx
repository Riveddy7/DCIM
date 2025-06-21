
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { TablesInsert } from '@/lib/database.types';

interface BulkPortGeneratorFormProps {
  assetId: string;
  tenantId: string;
  onSuccess: () => void;
}

const formSchema = z.object({
  count: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').max(100, 'No se pueden crear más de 100 puertos a la vez.'),
  name_prefix: z.string().min(1, 'El prefijo es requerido.'),
  start_number: z.coerce.number().int().min(0, 'El número inicial debe ser 0 o mayor.'),
  port_type: z.string().min(1, 'Debe seleccionar un tipo de puerto.'),
});

type FormValues = z.infer<typeof formSchema>;

export function BulkPortGeneratorForm({ assetId, tenantId, onSuccess }: BulkPortGeneratorFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      count: 24,
      name_prefix: 'GE1/0/',
      start_number: 1,
      port_type: 'RJ45',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    const portsToCreate: TablesInsert<'ports'>[] = [];
    for (let i = 0; i < values.count; i++) {
      portsToCreate.push({
        asset_id: assetId,
        tenant_id: tenantId,
        name: `${values.name_prefix}${values.start_number + i}`,
        port_type: values.port_type,
      });
    }

    const { error } = await supabase.from('ports').insert(portsToCreate);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error al generar puertos',
        description: error.message || 'Ocurrió un problema al guardar los puertos.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Puertos Creados',
        description: `${values.count} puertos han sido creados exitosamente.`,
      });
      onSuccess();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="count"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Cantidad</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Ej: 24" {...field} className="bg-input border-purple-500/30 text-gray-50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name_prefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Prefijo de Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: P, GE1/0/" {...field} className="bg-input border-purple-500/30 text-gray-50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="start_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Número Inicial</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Ej: 1" {...field} className="bg-input border-purple-500/30 text-gray-50" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="port_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Tipo de Puerto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-input border-purple-500/30 text-gray-300">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                  <SelectItem value="RJ45">RJ45</SelectItem>
                  <SelectItem value="SFP+">SFP+</SelectItem>
                  <SelectItem value="QSFP">QSFP</SelectItem>
                  <SelectItem value="LC_FIBER">LC Fibra Óptica</SelectItem>
                  <SelectItem value="SC_FIBER">SC Fibra Óptica</SelectItem>
                  <SelectItem value="POWER_C13">Power C13</SelectItem>
                  <SelectItem value="POWER_C19">Power C19</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4 pt-4">
          <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generar Puertos
          </Button>
        </div>
      </form>
    </Form>
  );
}
