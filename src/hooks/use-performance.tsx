'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from 'use-debounce';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  memoryUsage?: number;
  isSlowDevice: boolean;
}

interface UsePerformanceOptions {
  trackFPS?: boolean;
  trackMemory?: boolean;
  fpsThreshold?: number;
  renderTimeThreshold?: number;
}

/**
 * Hook for monitoring and optimizing component performance
 */
export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    trackFPS = true,
    trackMemory = false,
    fpsThreshold = 30,
    renderTimeThreshold = 16 // 60fps = 16ms per frame
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    isSlowDevice: false
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderTimes = useRef<number[]>([]);
  const rafId = useRef<number>();

  // FPS monitoring
  const measureFPS = useCallback(() => {
    if (!trackFPS) return;

    const now = performance.now();
    frameCount.current++;

    if (now - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      
      setMetrics(prev => ({
        ...prev,
        fps,
        isSlowDevice: fps < fpsThreshold
      }));

      frameCount.current = 0;
      lastTime.current = now;
    }

    rafId.current = requestAnimationFrame(measureFPS);
  }, [trackFPS, fpsThreshold]);

  // Start FPS monitoring
  useEffect(() => {
    if (trackFPS) {
      rafId.current = requestAnimationFrame(measureFPS);
      return () => {
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
        }
      };
    }
  }, [measureFPS, trackFPS]);

  // Memory monitoring
  useEffect(() => {
    if (!trackMemory || !('memory' in performance)) return;

    const measureMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }));
      }
    };

    const interval = setInterval(measureMemory, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [trackMemory]);

  // Render time measurement
  const measureRenderTime = useCallback((startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    renderTimes.current.push(renderTime);
    
    // Keep only last 10 measurements
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }
    
    // Calculate average render time
    const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    
    setMetrics(prev => ({
      ...prev,
      renderTime: avgRenderTime,
      isSlowDevice: avgRenderTime > renderTimeThreshold
    }));
  }, [renderTimeThreshold]);

  // Performance timer utility
  const startTimer = useCallback(() => {
    return performance.now();
  }, []);

  const endTimer = useCallback((startTime: number, label?: string) => {
    const duration = performance.now() - startTime;
    
    if (label && process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }
    
    measureRenderTime(startTime);
    return duration;
  }, [measureRenderTime]);

  return {
    metrics,
    startTimer,
    endTimer,
    isSlowDevice: metrics.isSlowDevice
  };
}

/**
 * Hook for debounced performance-sensitive operations
 */
export function useDebouncedPerformance<T>(
  value: T,
  delay: number = 300,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
) {
  const [debouncedValue] = useDebounce(value, delay, options);
  const { isSlowDevice } = usePerformance({ trackFPS: true });
  
  // Increase debounce delay on slow devices
  const adaptiveDelay = isSlowDevice ? delay * 1.5 : delay;
  const [adaptiveDebouncedValue] = useDebounce(value, adaptiveDelay, options);
  
  return {
    debouncedValue: isSlowDevice ? adaptiveDebouncedValue : debouncedValue,
    isSlowDevice,
    adaptiveDelay
  };
}

/**
 * Hook for throttling expensive operations
 */
export function useThrottle<T extends any[]>(
  callback: (...args: T) => void,
  delay: number = 100
) {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const throttledCallback = useCallback((...args: T) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      // Schedule the call for when the throttle period expires
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - (now - lastRun.current));
    }
  }, [callback, delay]);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return throttledCallback;
}

/**
 * Hook for intersection observer with performance optimizations
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {},
  enabled: boolean = true
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  
  useEffect(() => {
    if (!enabled || !elementRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setIntersectionRatio(entry.intersectionRatio);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        ...options
      }
    );
    
    observer.observe(elementRef.current);
    
    return () => observer.disconnect();
  }, [elementRef, enabled, options]);
  
  return { isIntersecting, intersectionRatio };
}

/**
 * Performance monitoring for React components
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string = 'Unknown'
) {
  return function PerformanceMonitoredComponent(props: P) {
    const { startTimer, endTimer } = usePerformance();
    
    useEffect(() => {
      const timer = startTimer();
      
      return () => {
        endTimer(timer, `${componentName} render`);
      };
    });
    
    return <Component {...props} />;
  };
}