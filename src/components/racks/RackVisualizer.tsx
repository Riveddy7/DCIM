
'use client';

import { cn } from '@/lib/utils';
import type { AssetWithPorts } from '@/lib/database.types';

interface RackVisualizerProps {
  total_u: number;
  assets: AssetWithPorts[];
  selectedAssetId: string | null;
  onAssetSelect: (assetId: string) => void;
}

export function RackVisualizer({ total_u, assets, selectedAssetId, onAssetSelect }: RackVisualizerProps) {
  const uMarkers = Array.from({ length: total_u }, (_, i) => total_u - i); // total_u down to 1

  return (
    <div className="glassmorphic-card p-4">
      <h3 className="font-headline text-lg text-gray-200 mb-4 text-center">Visualización del Rack</h3>
      <div className="flex gap-2" style={{ minHeight: `${total_u * 2.25}rem` }}> {/* Approx 2rem per U + spacing */}
        {/* U Markers Column */}
        <div className="flex flex-col-reverse justify-between items-center text-xs text-gray-400 pr-2 border-r border-purple-500/20 select-none">
          {uMarkers.map(u => (
            <div key={`marker-${u}`} className="h-8 flex items-center"> {/* Fixed height for U marker */}
              {u}
            </div>
          ))}
        </div>

        {/* Assets Area - Using CSS Grid */}
        <div
          className="relative flex-grow grid"
          style={{
            gridTemplateRows: `repeat(${total_u}, minmax(0, 1fr))`,
            gap: '1px', // Small gap between grid rows to visualize U boundaries
          }}
        >
          {assets.map(asset => {
            if (asset.start_u === null || asset.size_u === null || asset.start_u <= 0 || asset.size_u <= 0) {
              console.warn(`Asset ${asset.name} has invalid U positioning and will not be rendered.`);
              return null;
            }
            // CSS Grid rows are 1-indexed from the top.
            // start_u is 1-indexed from the bottom.
            // The asset visually starts at U-marker `asset.start_u` from bottom.
            // It ends at U-marker `asset.start_u + asset.size_u - 1` from bottom.
            // grid-row-start: row number for the top of the asset.
            // grid-row-end: row number for the bottom of the asset + 1, or span.
            
            const topMostUFromBottom = asset.start_u + asset.size_u - 1;
            const gridRowStart = total_u - topMostUFromBottom + 1;


            return (
              <div
                key={asset.id}
                onClick={() => onAssetSelect(asset.id)}
                title={`${asset.name} (Size: ${asset.size_u}U, Start U: ${asset.start_u})`}
                className={cn(
                  "bg-primary/20 hover:bg-primary/40 border border-purple-500/30 rounded flex items-center justify-center p-1 text-xs text-center cursor-pointer transition-all duration-200 ease-in-out text-gray-50 overflow-hidden",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400",
                  asset.id === selectedAssetId && "ring-2 ring-offset-2 ring-offset-background ring-purple-400 neon-glow-primary bg-primary/50 shadow-lg"
                )}
                style={{
                  gridRowStart: gridRowStart,
                  gridRowEnd: `span ${asset.size_u}`,
                  minHeight: `calc(${asset.size_u * 2}rem - 1px*(${asset.size_u - 1}))`, // Approximate visual height based on U marker height
                  zIndex: asset.id === selectedAssetId ? 10 : 1, // Bring selected asset to front
                }}
              >
                <span className="truncate">{asset.name || 'Unnamed Asset'}</span>
              </div>
            );
          })}
           {/* Empty U slots (optional, for visual completeness) */}
           {Array.from({ length: total_u }, (_, i) => i + 1).map(uRow => (
             <div 
                key={`empty-u-${uRow}`}
                className="border-b border-dashed border-gray-700/30"
                style={{ gridRowStart: uRow, gridRowEnd: uRow + 1, minHeight: '2rem', zIndex: 0}}
             />
           ))}
        </div>
      </div>
    </div>
  );
}
