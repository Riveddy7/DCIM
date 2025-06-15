
export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  name: string; // Corresponds to the key in the 'details' JSON object
  label: string; // User-friendly label for the form field
  type: 'text' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  options?: FieldOption[]; // For 'select' type
  defaultValue?: string | number;
  required?: boolean; // Basic client-side indication, server-side validation is also recommended
}

export interface AssetSchema {
  [assetType: string]: FieldDefinition[];
}

export const assetSchemas: AssetSchema = {
  SERVER: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: Dell, HP', required: true },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: PowerEdge R740', required: true },
    { name: 'serial_number', label: 'Número de Serie', type: 'text', placeholder: 'Ej: ABC123XYZ' },
    { name: 'ip_management', label: 'IP de Gestión', type: 'text', placeholder: 'Ej: 192.168.1.10' },
    { name: 'operating_system', label: 'Sistema Operativo', type: 'text', placeholder: 'Ej: Ubuntu Server 22.04' },
    { name: 'ram_gb', label: 'RAM (GB)', type: 'number', placeholder: 'Ej: 64', defaultValue: 16 },
    { name: 'storage_gb', label: 'Almacenamiento (GB)', type: 'number', placeholder: 'Ej: 1024', defaultValue: 256 },
  ],
  SWITCH: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: Cisco, Juniper', required: true },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: Catalyst 9300', required: true },
    { name: 'serial_number', label: 'Número de Serie', type: 'text', placeholder: 'Ej: DEF456ABC' },
    { name: 'ip_management', label: 'IP de Gestión', type: 'text', placeholder: 'Ej: 192.168.1.20' },
    { name: 'port_count', label: 'Número de Puertos', type: 'number', placeholder: 'Ej: 24', defaultValue: 24, required: true },
    {
      name: 'port_type',
      label: 'Tipo de Puertos Predominante',
      type: 'select',
      options: [
        { value: 'RJ45_1G', label: 'RJ45 1Gbps' },
        { value: 'RJ45_10G', label: 'RJ45 10Gbps' },
        { value: 'SFP+', label: 'SFP+' },
        { value: 'QSFP', label: 'QSFP' },
      ],
      defaultValue: 'RJ45_1G',
      required: true
    },
  ],
  PATCH_PANEL: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: Panduit, Leviton' },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: CP24BLY' },
    { name: 'port_count', label: 'Número de Puertos', type: 'number', placeholder: 'Ej: 24', defaultValue: 24, required: true },
    {
      name: 'connector_type',
      label: 'Tipo de Conectores',
      type: 'select',
      options: [
        { value: 'RJ45_CAT6', label: 'RJ45 CAT6' },
        { value: 'RJ45_CAT6A', label: 'RJ45 CAT6A' },
        { value: 'LC_FIBER', label: 'LC Fibra Óptica' },
        { value: 'SC_FIBER', label: 'SC Fibra Óptica' },
      ],
      defaultValue: 'RJ45_CAT6',
      required: true
    },
  ],
  ENDPOINT_USER: [
    {
      name: 'device_type',
      label: 'Tipo de Dispositivo',
      type: 'select',
      options: [
        { value: 'LAPTOP', label: 'Laptop' },
        { value: 'DESKTOP', label: 'Desktop' },
        { value: 'IP_PHONE', label: 'Teléfono IP' },
        { value: 'PRINTER', label: 'Impresora' },
        { value: 'OTHER', label: 'Otro' },
      ],
      defaultValue: 'LAPTOP',
      required: true
    },
    { name: 'assigned_user', label: 'Usuario Asignado', type: 'text', placeholder: 'Ej: Juan Pérez' },
    { name: 'department', label: 'Departamento', type: 'text', placeholder: 'Ej: Ventas, TI' },
    { name: 'hostname', label: 'Hostname', type: 'text', placeholder: 'Ej: VENTAS-LT-01' },
  ],
  PDU: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: APC, Eaton' },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: AP8853' },
    { name: 'outlet_count', label: 'Número de Salidas', type: 'number', placeholder: 'Ej: 24', defaultValue: 8 },
    {
      name: 'input_plug_type',
      label: 'Tipo de Conector de Entrada',
      type: 'select',
      options: [
        { value: 'NEMA_5_15P', label: 'NEMA 5-15P' },
        { value: 'NEMA_L5_30P', label: 'NEMA L5-30P' },
        { value: 'IEC_C14', label: 'IEC C14' },
        { value: 'IEC_C20', label: 'IEC C20' },
      ],
      defaultValue: 'NEMA_5_15P',
    },
  ],
  UPS: [
    { name: 'manufacturer', label: 'Fabricante', type: 'text', placeholder: 'Ej: APC, CyberPower' },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Ej: SMT1500RM2U' },
    { name: 'capacity_va', label: 'Capacidad (VA)', type: 'number', placeholder: 'Ej: 1500' },
    { name: 'battery_type', label: 'Tipo de Batería', type: 'text', placeholder: 'Ej: Plomo-ácido sellada' },
  ],
  // Add more asset types and their schemas here
  // EXAMPLE_TYPE: [
  //   { name: 'custom_field_1', label: 'Custom Field 1', type: 'text' },
  //   { name: 'custom_field_2', label: 'Custom Field 2', type: 'number' },
  // ],
};

// Helper function to get schema keys, could be used for select options
export const getAssetTypeOptions = (): FieldOption[] => {
  return Object.keys(assetSchemas).map(type => ({ value: type, label: type.replace(/_/g, ' ') }));
};
