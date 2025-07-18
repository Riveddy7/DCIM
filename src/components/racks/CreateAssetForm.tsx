
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { TablesInsert } from '@/lib/database.types';
import { assetSchemas, getAssetTypeOptions, type FieldDefinition } from '@/lib/asset-schemas';

const commonAssetFormSchema = z.object({
  name: z.string().min(1, 'El nombre del activo es requerido.'),
  asset_type: z.string().min(1, 'Debe seleccionar un tipo de activo.'),
  status: z.string().optional(),
  size_u: z.coerce.number().int().min(1, 'El tamaño debe ser al menos 1U.'),
});

// This type allows react-hook-form to manage fields not in the Zod schema.
type CommonAssetFormValues = z.infer<typeof commonAssetFormSchema> & {
  [key: string]: any;
};

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
  const [currentDynamicSchema, setCurrentDynamicSchema] = useState<FieldDefinition[]>([]);

  const form = useForm<CommonAssetFormValues>({
    resolver: zodResolver(commonAssetFormSchema),
    defaultValues: {
      name: '',
      asset_type: '',
      status: 'IN_PRODUCTION',
      size_u: 1,
    },
  });

  const watchedAssetType = form.watch('asset_type');

  useEffect(() => {
    const oldSchemaFields = currentDynamicSchema.map(f => f.name);
    
    if (watchedAssetType && assetSchemas[watchedAssetType]) {
      const newSchema = assetSchemas[watchedAssetType];
      setCurrentDynamicSchema(newSchema);
      
      oldSchemaFields.forEach(fieldName => {
        if (!newSchema.find(nf => nf.name === fieldName)) {
          form.unregister(fieldName as keyof CommonAssetFormValues);
        }
      });
      
      newSchema.forEach(fieldDef => {
        form.setValue(fieldDef.name, fieldDef.defaultValue ?? (fieldDef.type === 'number' ? null : ''));
      });
      
    } else {
      oldSchemaFields.forEach(fieldName => form.unregister(fieldName as keyof CommonAssetFormValues));
      setCurrentDynamicSchema([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAssetType]);

  async function onSubmit(values: CommonAssetFormValues) {
    setIsLoading(true);

    // KEY FIX: Use form.getValues() to retrieve ALL form data, because
    // the `values` object from the callback is stripped by the Zod resolver.
    const allFormValues = form.getValues();
    
    const detailsObject: Record<string, any> = {};
    currentDynamicSchema.forEach(fieldDef => {
      const value = allFormValues[fieldDef.name];
      if (value !== undefined && value !== null && value !== '') {
        detailsObject[fieldDef.name] = value;
      }
    });
    
    const newAssetData: TablesInsert<'assets'> = {
      tenant_id: tenantId,
      rack_id: rackId,
      location_id: rackLocationId,
      name: values.name, // Use the validated `values` for common fields
      asset_type: values.asset_type,
      status: values.status || 'IN_PRODUCTION',
      start_u: startU,
      size_u: values.size_u,
      details: Object.keys(detailsObject).length > 0 ? detailsObject : null,
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
  
  const assetTypeOptions = getAssetTypeOptions();

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

        <FormField
          control={form.control}
          name="asset_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Tipo de Activo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-input border-purple-500/30 text-gray-300">
                    <SelectValue placeholder="Selecciona un tipo de activo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                  {assetTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-300">Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || 'IN_PRODUCTION'}>
                <FormControl>
                  <SelectTrigger className="bg-input border-purple-500/30 text-gray-300">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                  <SelectItem value="IN_PRODUCTION">En Producción</SelectItem>
                  <SelectItem value="IN_STORAGE">En Almacén</SelectItem>
                  <SelectItem value="MAINTENANCE">En Mantenimiento</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                  <SelectItem value="DECOMMISSIONED">Decomisado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {currentDynamicSchema.map((fieldDef) => (
          <FormField
            key={fieldDef.name}
            control={form.control}
            name={fieldDef.name as keyof CommonAssetFormValues}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">{fieldDef.label} {fieldDef.required && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                  {fieldDef.type === 'text' ? (
                    <Input type="text" placeholder={fieldDef.placeholder} {...field} value={field.value ?? ''} className="bg-input border-purple-500/30 text-gray-50" />
                  ) : fieldDef.type === 'number' ? (
                    <Input type="number" placeholder={fieldDef.placeholder} {...field} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} value={field.value ?? ''} className="bg-input border-purple-500/30 text-gray-50" />
                  ) : fieldDef.type === 'select' && fieldDef.options ? (
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                      <SelectTrigger className="bg-input border-purple-500/30 text-gray-300">
                        <SelectValue placeholder={fieldDef.placeholder || 'Selecciona una opción'} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                        {fieldDef.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : fieldDef.type === 'textarea' ? (
                    <Textarea placeholder={fieldDef.placeholder} {...field} value={field.value ?? ''} className="bg-input border-purple-500/30 text-gray-50" rows={3}/>
                  ) : null}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading || !watchedAssetType} className="bg-primary text-primary-foreground hover:bg-primary/90 neon-glow-primary">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Añadir Activo
          </Button>
        </div>
      </form>
    </Form>
  );
}
