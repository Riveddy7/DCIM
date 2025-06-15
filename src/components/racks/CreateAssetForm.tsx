
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Not directly used, FormLabel is preferred
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { TablesInsert } from '@/lib/database.types';
import { assetSchemas, getAssetTypeOptions, type FieldDefinition } from '@/lib/asset-schemas';

// Schema for common fields, asset_type is now required
const commonAssetFormSchema = z.object({
  name: z.string().min(1, 'El nombre del activo es requerido.'),
  asset_type: z.string().min(1, 'Debe seleccionar un tipo de activo.'),
  status: z.string().optional(), // Consider making this a select with predefined statuses
  size_u: z.coerce.number().int().min(1, 'El tamaño debe ser al menos 1U.'),
  // `details` will be constructed dynamically, so not directly in Zod schema for react-hook-form root
});

type CommonAssetFormValues = z.infer<typeof commonAssetFormSchema>;

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

  const form = useForm<CommonAssetFormValues & Record<string, any>>({ // Allow extra properties for dynamic fields
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
    if (watchedAssetType && assetSchemas[watchedAssetType]) {
      const newSchema = assetSchemas[watchedAssetType];
      setCurrentDynamicSchema(newSchema);
      // Set default values for new dynamic fields
      newSchema.forEach(field => {
        if (form.getValues(field.name) === undefined && field.defaultValue !== undefined) {
          form.setValue(field.name, field.defaultValue);
        } else if (form.getValues(field.name) === undefined) {
           // Ensure field is registered if no default value
           form.register(field.name);
           form.setValue(field.name, field.type === 'number' ? null : '');
        }
      });
    } else {
      setCurrentDynamicSchema([]);
    }
  }, [watchedAssetType, form]);

  async function onSubmit(values: CommonAssetFormValues & Record<string, any>) {
    setIsLoading(true);

    const detailsObject: Record<string, any> = {};
    currentDynamicSchema.forEach(fieldDef => {
      if (values[fieldDef.name] !== undefined) {
        detailsObject[fieldDef.name] = values[fieldDef.name];
      }
    });

    const newAssetData: TablesInsert<'assets'> = {
      tenant_id: tenantId,
      rack_id: rackId,
      location_id: rackLocationId,
      name: values.name,
      asset_type: values.asset_type, // asset_type is now a top-level field
      status: values.status || null,
      start_u: startU,
      size_u: values.size_u,
      details: detailsObject,
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
        {/* Common Fields */}
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
        
        {/* Dynamic Fields based on selected asset_type */}
        {currentDynamicSchema.map((fieldDef) => (
          <FormField
            key={fieldDef.name}
            control={form.control}
            name={fieldDef.name} // Dynamic field name
            defaultValue={fieldDef.defaultValue ?? (fieldDef.type === 'number' ? null : '')}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">{fieldDef.label} {fieldDef.required && <span className="text-destructive">*</span>}</FormLabel>
                <FormControl>
                  <>
                    {fieldDef.type === 'text' && (
                      <Input type="text" placeholder={fieldDef.placeholder} {...field} className="bg-input border-purple-500/30 text-gray-50" />
                    )}
                    {fieldDef.type === 'number' && (
                      <Input type="number" placeholder={fieldDef.placeholder} {...field} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} value={field.value ?? ''} className="bg-input border-purple-500/30 text-gray-50" />
                    )}
                    {fieldDef.type === 'select' && fieldDef.options && (
                      <Select onValueChange={field.onChange} defaultValue={field.value || fieldDef.defaultValue}>
                        <SelectTrigger className="bg-input border-purple-500/30 text-gray-300">
                          <SelectValue placeholder={fieldDef.placeholder || 'Selecciona una opción'} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                          {fieldDef.options.map(option => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {fieldDef.type === 'textarea' && (
                      <Textarea placeholder={fieldDef.placeholder} {...field} className="bg-input border-purple-500/30 text-gray-50" rows={3}/>
                    )}
                  </>
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
