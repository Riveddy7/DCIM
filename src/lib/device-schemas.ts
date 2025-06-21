'use server';

import type { FieldDefinition, FieldOption } from './asset-schemas';

export const deviceSchemas: Record<string, FieldDefinition[]> = {
  CCTV_CAMERA: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: Hikvision, Axis', required: true },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: DS-2CD2143G0-I', required: true },
    { name: 'ip_address', label: 'Dirección IP', type: 'text', placeholder: 'Ej: 192.168.1.100' },
    { name: 'resolution', label: 'Resolución', type: 'text', placeholder: 'Ej: 4MP, 1080p' },
  ],
  VOIP_PHONE: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: Yealink, Polycom', required: true },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: T46S', required: true },
    { name: 'extension', label: 'Extensión', type: 'text', placeholder: 'Ej: 101' },
    { name: 'mac_address', label: 'Dirección MAC', type: 'text', placeholder: 'Ej: 00:1A:2B:3C:4D:5E' },
  ],
  ACCESS_POINT: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: Ubiquiti, Aruba', required: true },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: UAP-AC-PRO', required: true },
    { name: 'ip_management', label: 'IP de Gestión', type: 'text', placeholder: 'Ej: 192.168.1.200' },
    { name: 'ssid', label: 'SSID Principal', type: 'text', placeholder: 'Ej: CorporateWiFi' },
  ],
  PRINTER: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: HP, Brother', required: true },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: LaserJet Pro M404dn', required: true },
    { name: 'ip_address', label: 'Dirección IP', type: 'text', placeholder: 'Ej: 192.168.1.150' },
  ]
};

export const getDeviceTypeOptions = (): FieldOption[] => {
  return Object.keys(deviceSchemas).map(type => ({ value: type, label: type.replace(/_/g, ' ') }));
};
