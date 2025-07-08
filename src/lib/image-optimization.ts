// Image optimization utilities for floor plans

interface ImageResolution {
  width: number;
  height: number;
  quality: number;
  suffix: string;
}

const RESOLUTIONS: ImageResolution[] = [
  { width: 400, height: 300, quality: 60, suffix: 'thumb' },
  { width: 800, height: 600, quality: 70, suffix: 'medium' },
  { width: 1600, height: 1200, quality: 80, suffix: 'large' },
  { width: 3200, height: 2400, quality: 90, suffix: 'xl' }
];

export interface OptimizedImageUrls {
  thumb: string;
  medium: string;
  large: string;
  xl: string;
  original: string;
}

/**
 * Generates optimized image URLs for different resolutions
 * This is a placeholder implementation - in production you'd integrate with your image service
 */
export function generateOptimizedUrls(originalUrl: string): OptimizedImageUrls {
  // In a real implementation, this would generate actual optimized URLs
  // For now, we'll return the original URL for all resolutions
  // You could integrate with services like Cloudinary, ImageKit, or Next.js Image API
  
  const baseUrl = originalUrl.split('?')[0]; // Remove any existing query params
  const isSupabaseStorage = baseUrl.includes('supabase');
  
  if (isSupabaseStorage) {
    // Supabase storage supports some basic transformations
    return {
      thumb: `${baseUrl}?width=400&height=300&resize=contain&quality=60`,
      medium: `${baseUrl}?width=800&height=600&resize=contain&quality=70`,
      large: `${baseUrl}?width=1600&height=1200&resize=contain&quality=80`,
      xl: `${baseUrl}?width=3200&height=2400&resize=contain&quality=90`,
      original: originalUrl
    };
  }
  
  // Fallback to original URL for all resolutions
  return {
    thumb: originalUrl,
    medium: originalUrl,
    large: originalUrl,
    xl: originalUrl,
    original: originalUrl
  };
}

/**
 * Determines the best image resolution based on viewport size and device pixel ratio
 */
export function getBestResolution(
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = 1
): keyof OptimizedImageUrls {
  const targetWidth = containerWidth * devicePixelRatio;
  const targetHeight = containerHeight * devicePixelRatio;
  
  // Choose resolution based on the larger dimension
  const targetSize = Math.max(targetWidth, targetHeight);
  
  if (targetSize <= 400) return 'thumb';
  if (targetSize <= 800) return 'medium';
  if (targetSize <= 1600) return 'large';
  if (targetSize <= 3200) return 'xl';
  
  return 'original';
}

/**
 * Preloads critical images for better performance
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Image cache for storing loaded images
 */
class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private maxSize = 50; // Maximum number of cached images
  
  get(url: string): HTMLImageElement | undefined {
    return this.cache.get(url);
  }
  
  set(url: string, image: HTMLImageElement): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(url, image);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();

/**
 * Progressive image loading with blur effect
 */
export function createProgressiveLoader(
  lowResUrl: string,
  highResUrl: string,
  onProgress?: (stage: 'loading' | 'low-res' | 'high-res' | 'error') => void
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    onProgress?.('loading');
    
    // Load low-res image first
    const lowResImg = new Image();
    lowResImg.onload = () => {
      onProgress?.('low-res');
      
      // Start loading high-res image
      const highResImg = new Image();
      highResImg.onload = () => {
        onProgress?.('high-res');
        imageCache.set(highResUrl, highResImg);
        resolve(highResImg);
      };
      
      highResImg.onerror = () => {
        // Fallback to low-res if high-res fails
        onProgress?.('error');
        resolve(lowResImg);
      };
      
      highResImg.src = highResUrl;
    };
    
    lowResImg.onerror = () => {
      onProgress?.('error');
      reject(new Error('Failed to load image'));
    };
    
    lowResImg.src = lowResUrl;
  });
}

/**
 * Estimates image file size for bandwidth optimization
 */
export function estimateImageSize(
  width: number,
  height: number,
  quality: number = 80,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): number {
  const pixels = width * height;
  const baseSize = pixels * 3; // 3 bytes per pixel for RGB
  
  let compressionRatio: number;
  switch (format) {
    case 'jpeg':
      compressionRatio = quality / 100 * 0.1; // JPEG compression
      break;
    case 'png':
      compressionRatio = 0.5; // PNG compression (lossless)
      break;
    case 'webp':
      compressionRatio = quality / 100 * 0.08; // WebP compression (better than JPEG)
      break;
    default:
      compressionRatio = 0.1;
  }
  
  return Math.round(baseSize * compressionRatio);
}