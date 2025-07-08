'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { 
  generateOptimizedUrls, 
  getBestResolution, 
  createProgressiveLoader,
  imageCache 
} from '@/lib/image-optimization';

interface OptimizedFloorPlanImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  containerWidth?: number;
  containerHeight?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

type LoadingStage = 'loading' | 'low-res' | 'high-res' | 'error';

export function OptimizedFloorPlanImage({
  src,
  alt,
  style,
  className = '',
  containerWidth = 800,
  containerHeight = 600,
  priority = false,
  onLoad,
  onError
}: OptimizedFloorPlanImageProps) {
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('loading');
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate optimized URLs
  const optimizedUrls = useMemo(() => generateOptimizedUrls(src), [src]);
  
  // Determine best resolution for current viewport
  const bestResolution = useMemo(() => {
    const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    return getBestResolution(containerWidth, containerHeight, devicePixelRatio);
  }, [containerWidth, containerHeight]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load image with progressive enhancement
  useEffect(() => {
    if (!src) return;

    const loadImage = async () => {
      try {
        setLoadingStage('loading');
        
        // Check cache first
        const cachedImage = imageCache.get(optimizedUrls[bestResolution]);
        if (cachedImage) {
          setLoadingStage('high-res');
          onLoad?.();
          return;
        }

        // Use progressive loading: thumb -> best resolution
        const thumbUrl = optimizedUrls.thumb;
        const targetUrl = optimizedUrls[bestResolution];
        
        await createProgressiveLoader(
          thumbUrl,
          targetUrl,
          (stage) => {
            setLoadingStage(stage);
            if (stage === 'high-res') {
              onLoad?.();
            }
          }
        );
        
      } catch (error) {
        console.error('Failed to load floor plan image:', error);
        setLoadingStage('error');
        onError?.(error as Error);
      }
    };

    loadImage();
  }, [src, bestResolution, optimizedUrls, onLoad, onError]);

  // Retry loading
  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setLoadingStage('loading');
    }
  };

  // Show skeleton while loading
  if (loadingStage === 'loading') {
    return (
      <motion.div
        ref={containerRef}
        className={`relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Skeleton className="w-full h-full" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="text-center text-gray-400">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"
            />
            <p className="text-xs">Cargando plano...</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Show error state
  if (loadingStage === 'error') {
    return (
      <motion.div
        ref={containerRef}
        className={`relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>
                {isOnline 
                  ? 'Error al cargar el plano de planta' 
                  : 'Sin conexión a internet'
                }
              </span>
            </div>
            {retryCount < 3 && (
              <button
                onClick={handleRetry}
                className="text-xs underline hover:no-underline self-start"
              >
                Reintentar ({3 - retryCount} intentos restantes)
              </button>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Show image with appropriate resolution
  const imageUrl = loadingStage === 'low-res' ? optimizedUrls.thumb : optimizedUrls[bestResolution];
  
  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.img
        ref={imgRef}
        src={imageUrl}
        alt={alt}
        style={style}
        className={`
          w-full h-full object-cover transition-all duration-500
          ${loadingStage === 'low-res' ? 'blur-sm scale-105' : 'blur-0 scale-100'}
        `}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Quality indicator */}
      <AnimatePresence>
        {loadingStage === 'low-res' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs"
          >
            Cargando calidad HD...
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Resolution indicator (dev mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {bestResolution} ({containerWidth}x{containerHeight})
        </div>
      )}
    </motion.div>
  );
}