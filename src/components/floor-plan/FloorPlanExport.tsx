'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileImage, 
  FileText, 
  Printer,
  Settings,
  Image as ImageIcon,
  File,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type ExportFormat = 'png' | 'jpeg' | 'pdf' | 'svg';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  includeBackground: boolean;
  includeGrid: boolean;
  includeLabels: boolean;
  includeMetadata: boolean;
  scale: number;
  paperSize?: 'a4' | 'a3' | 'letter' | 'custom';
  customWidth?: number;
  customHeight?: number;
  fileName?: string;
}

interface FloorPlanExportProps {
  canvasRef: React.RefObject<HTMLElement>;
  locationName: string;
  onExport?: (options: ExportOptions) => void;
}

const qualitySettings = {
  low: { scale: 1, quality: 0.6 },
  medium: { scale: 1.5, quality: 0.8 },
  high: { scale: 2, quality: 0.9 },
  ultra: { scale: 3, quality: 1.0 }
};

const paperSizes = {
  a4: { width: 210, height: 297 },
  a3: { width: 297, height: 420 },
  letter: { width: 216, height: 279 }
};

export function FloorPlanExport({ canvasRef, locationName, onExport }: FloorPlanExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 'high',
    includeBackground: true,
    includeGrid: true,
    includeLabels: true,
    includeMetadata: true,
    scale: 2,
    paperSize: 'a4',
    fileName: `plano-${locationName.toLowerCase().replace(/\s+/g, '-')}`
  });

  const { toast } = useToast();

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const generateFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseName = options.fileName || `plano-${locationName.toLowerCase().replace(/\s+/g, '-')}`;
    return `${baseName}-${timestamp}.${options.format}`;
  };

  const captureCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!canvasRef.current) {
      throw new Error('Canvas no encontrado');
    }

    const qualitySetting = qualitySettings[options.quality];
    
    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: options.includeBackground ? '#1a1a1a' : null,
      scale: qualitySetting.scale,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (element) => {
        // Optionally hide grid or labels based on options
        if (!options.includeGrid && element.classList.contains('grid-cell')) {
          return true;
        }
        if (!options.includeLabels && element.classList.contains('rack-label')) {
          return true;
        }
        return false;
      }
    });

    return canvas;
  };

  const exportAsPNG = async (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = generateFileName();
    link.href = canvas.toDataURL('image/png', qualitySettings[options.quality].quality);
    link.click();
  };

  const exportAsJPEG = async (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = generateFileName();
    link.href = canvas.toDataURL('image/jpeg', qualitySettings[options.quality].quality);
    link.click();
  };

  const exportAsPDF = async (canvas: HTMLCanvasElement) => {
    const imgData = canvas.toDataURL('image/png', qualitySettings[options.quality].quality);
    
    const paperSize = options.paperSize === 'custom' 
      ? { width: options.customWidth || 210, height: options.customHeight || 297 }
      : paperSizes[options.paperSize || 'a4'];
    
    const pdf = new jsPDF({
      orientation: paperSize.width > paperSize.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [paperSize.width, paperSize.height]
    });

    // Calculate dimensions to fit the page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgAspectRatio = canvas.width / canvas.height;
    const pageAspectRatio = pageWidth / pageHeight;

    let imgWidth, imgHeight;
    if (imgAspectRatio > pageAspectRatio) {
      imgWidth = pageWidth * 0.9; // 90% of page width
      imgHeight = imgWidth / imgAspectRatio;
    } else {
      imgHeight = pageHeight * 0.9; // 90% of page height
      imgWidth = imgHeight * imgAspectRatio;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    // Add metadata if requested
    if (options.includeMetadata) {
      pdf.setFontSize(16);
      pdf.text(`Plano de Planta: ${locationName}`, 20, 20);
      pdf.setFontSize(10);
      pdf.text(`Generado: ${new Date().toLocaleDateString()}`, 20, 30);
      pdf.text(`Resolución: ${canvas.width}x${canvas.height}px`, 20, 35);
    }

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(generateFileName());
  };

  const exportAsSVG = async () => {
    // SVG export would require more complex implementation
    // For now, we'll show a placeholder
    toast({
      title: 'Función en desarrollo',
      description: 'La exportación SVG estará disponible pronto.',
      variant: 'destructive'
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      onExport?.(options);
      
      if (options.format === 'svg') {
        await exportAsSVG();
      } else {
        const canvas = await captureCanvas();
        
        switch (options.format) {
          case 'png':
            await exportAsPNG(canvas);
            break;
          case 'jpeg':
            await exportAsJPEG(canvas);
            break;
          case 'pdf':
            await exportAsPDF(canvas);
            break;
        }
      }
      
      toast({
        title: 'Exportación completada',
        description: `El plano se ha exportado como ${options.format.toUpperCase()}.`,
      });
      
    } catch (error) {
      console.error('Error durante la exportación:', error);
      toast({
        title: 'Error de exportación',
        description: 'No se pudo exportar el plano. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="glassmorphic-card border-purple-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline text-lg text-purple-200 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Plano
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-400 hover:text-purple-300"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Export Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              updateOption('format', 'png');
              handleExport();
            }}
            disabled={isExporting}
            className="flex items-center gap-2 text-sm"
            variant="outline"
          >
            <ImageIcon className="h-4 w-4" />
            PNG
          </Button>
          
          <Button
            onClick={() => {
              updateOption('format', 'pdf');
              handleExport();
            }}
            disabled={isExporting}
            className="flex items-center gap-2 text-sm"
            variant="outline"
          >
            <File className="h-4 w-4" />
            PDF
          </Button>
        </div>

        {/* Advanced Options */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="space-y-4 border-t border-purple-500/30 pt-4"
          >
            {/* Format Selection */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Formato</Label>
              <Select 
                value={options.format} 
                onValueChange={(value: ExportFormat) => updateOption('format', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG (Recomendado)</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="svg" disabled>SVG (Próximamente)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quality Selection */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Calidad</Label>
              <Select 
                value={options.quality} 
                onValueChange={(value: ExportQuality) => updateOption('quality', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja (Rápido)</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta (Recomendado)</SelectItem>
                  <SelectItem value="ultra">Ultra (Lento)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Name */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Nombre del archivo</Label>
              <Input
                value={options.fileName}
                onChange={(e) => updateOption('fileName', e.target.value)}
                placeholder="plano-datacenter"
              />
            </div>

            {/* Include Options */}
            <div className="space-y-3">
              <Label className="text-sm text-gray-300">Incluir en la exportación</Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="background"
                    checked={options.includeBackground}
                    onCheckedChange={(checked) => updateOption('includeBackground', !!checked)}
                  />
                  <Label htmlFor="background" className="text-sm">Fondo de imagen</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="grid"
                    checked={options.includeGrid}
                    onCheckedChange={(checked) => updateOption('includeGrid', !!checked)}
                  />
                  <Label htmlFor="grid" className="text-sm">Cuadrícula</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="labels"
                    checked={options.includeLabels}
                    onCheckedChange={(checked) => updateOption('includeLabels', !!checked)}
                  />
                  <Label htmlFor="labels" className="text-sm">Etiquetas de racks</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={options.includeMetadata}
                    onCheckedChange={(checked) => updateOption('includeMetadata', !!checked)}
                  />
                  <Label htmlFor="metadata" className="text-sm">Metadatos (solo PDF)</Label>
                </div>
              </div>
            </div>

            {/* PDF-specific options */}
            {options.format === 'pdf' && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-300">Tamaño de papel</Label>
                <Select 
                  value={options.paperSize} 
                  onValueChange={(value: 'a4' | 'a3' | 'letter' | 'custom') => updateOption('paperSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="a3">A3</SelectItem>
                    <SelectItem value="letter">Carta</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </motion.div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar {options.format.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}