
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud, Crop, Grid3x3, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Utility Functions for Image Cropping ---

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = (rotation * Math.PI) / 180;

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotation and flip around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // As a blob
  return new Promise((resolve) => {
    canvas.toBlob((file) => {
        if (file) {
            resolve(URL.createObjectURL(file));
        }
    }, 'image/jpeg');
  });
}

const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};


// --- Main Wizard Component ---

interface SetupWizardProps {
  locationId: string;
  tenantId: string;
  onSetupComplete: () => void;
}

export function SetupWizard({ locationId, tenantId, onSetupComplete }: SetupWizardProps) {
  const [step, setStep] = useState<'upload' | 'crop' | 'grid'>('upload');
  const { toast } = useToast();
  
  // State for image handling
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  
  // State for grid configuration
  const [gridCols, setGridCols] = useState(50);
  const [gridRows, setGridRows] = useState(30);

  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setOriginalFile(file);
      setImageSrc(URL.createObjectURL(file));
      setStep('crop');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    multiple: false,
  });

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleGoToGridStep = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsLoading(true);
    try {
      const croppedImageResult = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImage(croppedImageResult);
      setStep('grid');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!originalFile || !croppedAreaPixels) {
      toast({ title: 'Faltan datos', description: 'Por favor, completa todos los pasos.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', originalFile);
    formData.append('location_id', locationId);
    formData.append('tenant_id', tenantId);
    formData.append('crop_data', JSON.stringify(croppedAreaPixels));
    formData.append('grid_cols', gridCols.toString());
    formData.append('grid_rows', gridRows.toString());

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_FLOORPLAN_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error('La URL del webhook no está configurada.');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        // No agregar 'Content-Type' header aquí.
      });

      if (!response.ok) {
        throw new Error(`El servidor de n8n respondió con el estado: ${response.status}`);
      }

      toast({
        title: 'Procesando Plano',
        description: 'Tu plano ha sido enviado y se está optimizando. Aparecerá en la lista en unos momentos.',
      });
      onSetupComplete();

    } catch (error: any) {
      console.error('Error al enviar el plano a n8n:', error);
      toast({
        title: 'Error de Subida',
        description: error.message || 'No se pudo enviar el plano para su procesamiento.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
        if (imageSrc) URL.revokeObjectURL(imageSrc);
        if (croppedImage) URL.revokeObjectURL(croppedImage);
    }
  }, [imageSrc, croppedImage]);


  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Sube tu Plano de Planta</h3>
            <p className="text-gray-400 mb-6">Arrastra y suelta un archivo PNG o JPG, o haz clic para seleccionar.</p>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-purple-500/30 hover:border-primary'}`}>
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                <UploadCloud className="w-16 h-16" />
                <p>{isDragActive ? 'Suelta el archivo aquí...' : 'Arrastra un archivo o haz clic para seleccionar'}</p>
              </div>
            </div>
          </div>
        );

      case 'crop':
        return (
          <div>
            <h3 className="text-xl font-bold mb-2 text-center">Ajusta y Recorta el Plano</h3>
            <p className="text-gray-400 mb-4 text-center">Define el área exacta que quieres usar para el plano interactivo.</p>
            <div className="relative w-full h-[50vh] bg-gray-900 rounded-lg overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>
            <div className="flex justify-end mt-6">
                <Button onClick={handleGoToGridStep} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crop className="mr-2 h-4 w-4" />}
                    Confirmar Recorte
                </Button>
            </div>
          </div>
        );

      case 'grid':
        return (
            <div>
                 <h3 className="text-xl font-bold mb-2 text-center">Define la Cuadrícula</h3>
                <p className="text-gray-400 mb-4 text-center">Ajusta el número de filas y columnas para la colocación de racks.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-purple-500/20">
                        {croppedImage ? (
                            <>
                                <img src={croppedImage} alt="Plano Recortado" className="absolute inset-0 w-full h-full object-contain" />
                                <div
                                    className="absolute inset-0 grid pointer-events-none"
                                    style={{
                                        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                                        gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                                        border: '1px solid hsla(var(--primary), 0.2)',
                                    }}
                                >
                                    {Array.from({ length: gridCols * gridRows }).map((_, i) => (
                                        <div key={i} className="border border-purple-500/20"></div>
                                    ))}
                                </div>
                            </>
                        ) : <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>}
                    </div>
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="grid-cols" className="flex justify-between mb-2">
                                <span>Columnas</span>
                                <span className="text-primary font-bold">{gridCols}</span>
                            </Label>
                            <Slider
                                id="grid-cols"
                                value={[gridCols]}
                                onValueChange={(value) => setGridCols(value[0])}
                                min={10}
                                max={100}
                                step={1}
                            />
                        </div>
                         <div>
                            <Label htmlFor="grid-rows" className="flex justify-between mb-2">
                                <span>Filas</span>
                                <span className="text-primary font-bold">{gridRows}</span>
                            </Label>
                            <Slider
                                id="grid-rows"
                                value={[gridRows]}
                                onValueChange={(value) => setGridRows(value[0])}
                                min={10}
                                max={100}
                                step={1}
                            />
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end mt-6">
                    <Button onClick={() => setStep('crop')} variant="outline" className="mr-4">Volver a Recortar</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                         {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Guardar Configuración
                    </Button>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return <div className="p-2">{renderStepContent()}</div>;
}
