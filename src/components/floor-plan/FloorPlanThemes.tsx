'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Zap, 
  Network, 
  Thermometer, 
  Activity,
  Server,
  Eye,
  EyeOff,
  Moon,
  Sun
} from 'lucide-react';

export type ThemeType = 'default' | 'capacity' | 'power' | 'network' | 'temperature' | 'status' | 'negative' | 'grayscale';

interface ThemeOption {
  id: ThemeType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  enabled: boolean;
}

interface FloorPlanThemesProps {
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  availableThemes?: ThemeType[];
}

const themeOptions: ThemeOption[] = [
  {
    id: 'default',
    name: 'Vista Normal',
    description: 'Vista estándar del plano',
    icon: Eye,
    color: 'bg-blue-500',
    enabled: true
  },
  {
    id: 'capacity',
    name: 'Capacidad',
    description: 'Muestra el uso de espacio en cada rack',
    icon: Activity,
    color: 'bg-green-500',
    enabled: true
  },
  {
    id: 'power',
    name: 'Alimentación',
    description: 'Visualiza el consumo y distribución eléctrica',
    icon: Zap,
    color: 'bg-yellow-500',
    enabled: true
  },
  {
    id: 'network',
    name: 'Red',
    description: 'Conectividad y topología de red',
    icon: Network,
    color: 'bg-purple-500',
    enabled: true
  },
  {
    id: 'temperature',
    name: 'Temperatura',
    description: 'Mapa de calor térmico del datacenter',
    icon: Thermometer,
    color: 'bg-red-500',
    enabled: false // Not implemented yet
  },
  {
    id: 'status',
    name: 'Estado',
    description: 'Estado operacional de equipos',
    icon: Server,
    color: 'bg-cyan-500',
    enabled: true
  },
  {
    id: 'grayscale',
    name: 'Escala de Grises',
    description: 'Convierte el plano a blanco y negro',
    icon: Sun,
    color: 'bg-gray-500',
    enabled: true
  },
  {
    id: 'negative',
    name: 'Negativo',
    description: 'Invierte los colores del plano (fondo negro)',
    icon: Moon,
    color: 'bg-black',
    enabled: true
  }
];

export function FloorPlanThemes({ 
  currentTheme, 
  onThemeChange, 
  availableThemes = ['default', 'capacity', 'power', 'network', 'status', 'grayscale', 'negative'] 
}: FloorPlanThemesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredThemes = themeOptions.filter(theme => 
    availableThemes.includes(theme.id) && theme.enabled
  );

  const currentThemeInfo = themeOptions.find(theme => theme.id === currentTheme);

  return (
    <Card className="glassmorphic-card border-purple-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-lg text-purple-200 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Temas de Vista
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-400 hover:text-purple-300"
          >
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Theme Display */}
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded border border-gray-700/50">
          {currentThemeInfo && (
            <>
              <div className={`w-3 h-3 rounded-full ${currentThemeInfo.color}`} />
              <div className="flex-1">
                <h4 className="font-medium text-purple-200">{currentThemeInfo.name}</h4>
                <p className="text-xs text-gray-400">{currentThemeInfo.description}</p>
              </div>
              <currentThemeInfo.icon className="h-5 w-5 text-purple-400" />
            </>
          )}
        </div>

        {/* Theme Selector */}
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Cambiar vista</label>
          <Select value={currentTheme} onValueChange={(value: ThemeType) => onThemeChange(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredThemes.map((theme) => (
                <SelectItem key={theme.id} value={theme.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${theme.color}`} />
                    <theme.icon className="h-4 w-4" />
                    {theme.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Theme Options */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="border-t border-purple-500/30 pt-3">
                <h5 className="text-sm font-medium text-purple-200 mb-2">Temas Disponibles</h5>
                <div className="grid grid-cols-1 gap-2">
                  {filteredThemes.map((theme) => (
                    <motion.button
                      key={theme.id}
                      className={`
                        flex items-center gap-3 p-2 rounded border transition-all text-left
                        ${currentTheme === theme.id 
                          ? 'border-purple-500/50 bg-purple-500/10' 
                          : 'border-gray-700/50 hover:border-purple-500/30 hover:bg-gray-800/50'
                        }
                      `}
                      onClick={() => onThemeChange(theme.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-3 h-3 rounded-full ${theme.color} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <theme.icon className="h-4 w-4 text-purple-400" />
                          <span className="font-medium text-sm text-purple-200">
                            {theme.name}
                          </span>
                          {currentTheme === theme.id && (
                            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                              Activo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{theme.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Theme Legend */}
              <div className="border-t border-purple-500/30 pt-3">
                <h5 className="text-sm font-medium text-purple-200 mb-2">Leyenda</h5>
                <ThemeLegend theme={currentTheme} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function ThemeLegend({ theme }: { theme: ThemeType }) {
  const legendItems = {
    default: [
      { color: 'bg-primary/70', label: 'Rack colocado' },
      { color: 'bg-gray-500/50', label: 'Posición vacía' }
    ],
    capacity: [
      { color: 'bg-green-500', label: 'Baja utilización (0-30%)' },
      { color: 'bg-yellow-500', label: 'Media utilización (31-70%)' },
      { color: 'bg-red-500', label: 'Alta utilización (71-100%)' }
    ],
    power: [
      { color: 'bg-blue-500', label: 'Bajo consumo' },
      { color: 'bg-yellow-500', label: 'Consumo normal' },
      { color: 'bg-red-500', label: 'Alto consumo' },
      { color: 'bg-gray-500', label: 'Sin datos de power' }
    ],
    network: [
      { color: 'bg-green-500', label: 'Bien conectado' },
      { color: 'bg-yellow-500', label: 'Conectividad parcial' },
      { color: 'bg-red-500', label: 'Sin conectividad' }
    ],
    temperature: [
      { color: 'bg-blue-500', label: 'Frío (<20°C)' },
      { color: 'bg-green-500', label: 'Normal (20-25°C)' },
      { color: 'bg-yellow-500', label: 'Tibio (25-30°C)' },
      { color: 'bg-red-500', label: 'Caliente (>30°C)' }
    ],
    status: [
      { color: 'bg-green-500', label: 'Operativo' },
      { color: 'bg-yellow-500', label: 'Advertencia' },
      { color: 'bg-red-500', label: 'Error' },
      { color: 'bg-gray-500', label: 'Desconocido' }
    ],
    grayscale: [
      { color: 'bg-gray-300', label: 'Imagen en escala de grises' },
      { color: 'bg-primary/70', label: 'Racks con colores normales' }
    ],
    negative: [
      { color: 'bg-black', label: 'Fondo negro (invertido)' },
      { color: 'bg-white', label: 'Elementos claros invertidos' },
      { color: 'bg-primary/70', label: 'Racks con colores normales' }
    ]
  };

  const items = legendItems[theme] || legendItems.default;

  return (
    <div className="grid grid-cols-1 gap-1">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded ${item.color}`} />
          <span className="text-xs text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}