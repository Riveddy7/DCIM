'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical,
  Sun,
  Contrast,
  Palette
} from 'lucide-react';

interface ImageAdjustments {
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

interface FloorPlanImageToolsProps {
  onAdjustmentsChange: (adjustments: ImageAdjustments) => void;
  isVisible?: boolean;
}

export function FloorPlanImageTools({ 
  onAdjustmentsChange, 
  isVisible = false 
}: FloorPlanImageToolsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    opacity: 50,
    brightness: 100,
    contrast: 100,
    saturation: 0, // 0 = grayscale by default
    rotation: 0,
    flipH: false,
    flipV: false
  });

  const updateAdjustment = (key: keyof ImageAdjustments, value: number | boolean) => {
    const newAdjustments = { ...adjustments, [key]: value };
    setAdjustments(newAdjustments);
    onAdjustmentsChange(newAdjustments);
  };

  const resetAdjustments = () => {
    const defaultAdjustments = {
      opacity: 50,
      brightness: 100,
      contrast: 100,
      saturation: 0,
      rotation: 0,
      flipH: false,
      flipV: false
    };
    setAdjustments(defaultAdjustments);
    onAdjustmentsChange(defaultAdjustments);
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="absolute top-4 left-4 z-40 w-80"
    >
      <Card className="glassmorphic-card border-blue-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-lg text-blue-200 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ajustes de Imagen
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-400 hover:text-blue-300"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="space-y-6">
                {/* Opacity */}
                <div className="space-y-2">
                  <Label className="text-sm text-blue-200 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Opacidad: {adjustments.opacity}%
                  </Label>
                  <Slider
                    value={[adjustments.opacity]}
                    onValueChange={(value) => updateAdjustment('opacity', value[0])}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Brightness */}
                <div className="space-y-2">
                  <Label className="text-sm text-blue-200 flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Brillo: {adjustments.brightness}%
                  </Label>
                  <Slider
                    value={[adjustments.brightness]}
                    onValueChange={(value) => updateAdjustment('brightness', value[0])}
                    max={200}
                    min={50}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-2">
                  <Label className="text-sm text-blue-200 flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    Contraste: {adjustments.contrast}%
                  </Label>
                  <Slider
                    value={[adjustments.contrast]}
                    onValueChange={(value) => updateAdjustment('contrast', value[0])}
                    max={200}
                    min={50}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-2">
                  <Label className="text-sm text-blue-200 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Saturación: {adjustments.saturation}%
                  </Label>
                  <Slider
                    value={[adjustments.saturation]}
                    onValueChange={(value) => updateAdjustment('saturation', value[0])}
                    max={200}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Transform Controls */}
                <div className="space-y-3 border-t border-blue-500/20 pt-4">
                  <Label className="text-sm text-blue-200">Transformaciones</Label>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={adjustments.flipH ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAdjustment('flipH', !adjustments.flipH)}
                      className="flex-1"
                    >
                      <FlipHorizontal className="h-4 w-4 mr-1" />
                      Flip H
                    </Button>
                    
                    <Button
                      variant={adjustments.flipV ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateAdjustment('flipV', !adjustments.flipV)}
                      className="flex-1"
                    >
                      <FlipVertical className="h-4 w-4 mr-1" />
                      Flip V
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAdjustment('rotation', adjustments.rotation - 90)}
                    >
                      <RotateCw className="h-4 w-4 transform rotate-180" />
                    </Button>
                    
                    <div className="flex-1 text-center text-sm text-blue-200">
                      {adjustments.rotation}°
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateAdjustment('rotation', adjustments.rotation + 90)}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Reset Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={resetAdjustments}
                  className="w-full"
                >
                  Restablecer Ajustes
                </Button>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}