'use client';

import { ReactNode } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Move, ExpandIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloorPlanZoomProps {
  children: ReactNode;
  disabled?: boolean;
  showControls?: boolean;
}

export function FloorPlanZoom({ children, disabled = false, showControls = true }: FloorPlanZoomProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TransformWrapper
      initialScale={0.8}
      minScale={0.2}
      maxScale={8}
      limitToBounds={true}
      centerOnInit={true}
      smooth={true}
      wheel={{ smoothStep: 0.01 }}
      pinch={{ step: 10 }}
      doubleClick={{ disabled: false, mode: 'zoomIn', step: 30 }}
      panning={{
        velocityDisabled: false,
        lockAxisX: false,
        lockAxisY: false,
      }}
    >
      {({ zoomIn, zoomOut, resetTransform, centerView, instance }) => (
        <div className="relative w-full h-full">
          
          {/* Zoom Controls */}
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute top-4 right-4 z-50"
            >
              <Card className="glassmorphic-card border-purple-500/30 p-2">
                <div className="flex flex-col gap-2">
                  {/* Zoom In */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => zoomIn(0.3)}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  {/* Zoom Out */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => zoomOut(0.3)}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  {/* Reset Transform */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resetTransform()}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  
                  {/* Fit to Screen */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => centerView(0.8)}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                    title="Fit to Screen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  
                  {/* Center View */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => centerView()}
                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                    title="Center View"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Zoom Level Indicator */}
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="absolute bottom-4 right-4 z-50"
            >
              <Card className="glassmorphic-card border-purple-500/30 px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-purple-200">
                  <ExpandIcon className="h-3 w-3" />
                  <span>
                    {Math.round((instance?.transformState.scale || 1) * 100)}%
                  </span>
                </div>
              </Card>
            </motion.div>
          )}

          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full"
          >
            {children}
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  );
}