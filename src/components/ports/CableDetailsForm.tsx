
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Palette, Cable, Ruler } from 'lucide-react';

interface CableDetailsFormProps {
  onDetailsChange: (details: Record<string, any> | null) => void;
}

export function CableDetailsForm({ onDetailsChange }: CableDetailsFormProps) {
  const [details, setDetails] = useState({
    brand: '',
    color: '',
    category: '',
    length_m: '',
  });

  useEffect(() => {
    const hasValue = Object.values(details).some(v => v !== '' && v !== null);
    if (hasValue) {
      const numericLength = parseFloat(details.length_m);
      onDetailsChange({
        brand: details.brand || null,
        color: details.color || null,
        category: details.category || null,
        length_m: isNaN(numericLength) ? null : numericLength,
      });
    } else {
      onDetailsChange(null);
    }
  }, [details, onDetailsChange]);

  const handleChange = (key: keyof typeof details, value: string) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="pt-4 mt-4 border-t border-purple-500/20">
       <h3 className="font-semibold text-lg mb-4 flex items-center"><Cable className="mr-2 h-5 w-5 text-amber-400"/>Detalles del Cable (Opcional)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="space-y-2">
            <Label htmlFor="cable-brand" className="text-gray-300 flex items-center"><Package className="mr-2 h-4 w-4"/>Marca</Label>
            <Input 
                id="cable-brand"
                value={details.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Ej: Panduit"
                className="bg-input border-purple-500/30 text-gray-50"
            />
        </div>

        <div className="space-y-2">
            <Label htmlFor="cable-color" className="text-gray-300 flex items-center"><Palette className="mr-2 h-4 w-4"/>Color</Label>
            <Select onValueChange={(value) => handleChange('color', value)} value={details.color}>
                <SelectTrigger id="cable-color" className="bg-input border-purple-500/30 text-gray-300">
                    <SelectValue placeholder="Selecciona un color" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                    <SelectItem value="azul">Azul</SelectItem>
                    <SelectItem value="blanco">Blanco</SelectItem>
                    <SelectItem value="gris">Gris</SelectItem>
                    <SelectItem value="rojo">Rojo</SelectItem>
                    <SelectItem value="verde">Verde</SelectItem>
                    <SelectItem value="amarillo">Amarillo</SelectItem>
                    <SelectItem value="negro">Negro</SelectItem>
                </SelectContent>
            </Select>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="cable-category" className="text-gray-300 flex items-center"><Cable className="mr-2 h-4 w-4"/>Categoría</Label>
            <Select onValueChange={(value) => handleChange('category', value)} value={details.category}>
                 <SelectTrigger id="cable-category" className="bg-input border-purple-500/30 text-gray-300">
                    <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-purple-500/50 text-gray-200">
                    <SelectItem value="CAT5e">CAT5e</SelectItem>
                    <SelectItem value="CAT6">CAT6</SelectItem>
                    <SelectItem value="CAT6a">CAT6a</SelectItem>
                    <SelectItem value="CAT7">CAT7</SelectItem>
                    <SelectItem value="FIBRA_OM3">Fibra OM3</SelectItem>
                    <SelectItem value="FIBRA_OM4">Fibra OM4</SelectItem>
                    <SelectItem value="FIBRA_OS2">Fibra OS2</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label htmlFor="cable-length" className="text-gray-300 flex items-center"><Ruler className="mr-2 h-4 w-4"/>Longitud (m)</Label>
            <Input 
                id="cable-length"
                type="number"
                value={details.length_m}
                onChange={(e) => handleChange('length_m', e.target.value)}
                placeholder="Ej: 3.5"
                className="bg-input border-purple-500/30 text-gray-50"
            />
        </div>
      </div>
    </div>
  );
}
