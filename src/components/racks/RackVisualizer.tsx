
'use client';

import { cn } from '@/lib/utils';
import type { AssetWithPorts } from '@/lib/database.types';

interface RackVisualizerProps {
  total_u: number; // Assumed to be always positive and valid from parent
  assets: AssetWithPorts[];
  selectedAssetId: string | null;
  onAssetSelect: (assetId: string) => void;
}

export function RackVisualizer({ total_u, assets, selectedAssetId, onAssetSelect }: RackVisualizerProps) {
  const uMarkers = Array.from({ length: total_u }, (_, i) => total_u - i);

  return (
    <div className="glassmorphic-card p-4">
      <h3 className="font-headline text-lg text-gray-200 mb-4 text-center">Visualización del Rack</h3>
      <div className="flex gap-2" style={{ minHeight: `${total_u * 2.25}rem` }}>
        <div className="flex flex-col-reverse justify-between items-center text-xs text-gray-400 pr-2 border-r border-purple-500/20 select-none">
          {uMarkers.map(u => (
            <div key={`marker-${u}`} className="h-8 flex items-center">
              {u}
            </div>
          ))}
        </div>

        <div
          className="relative flex-grow grid"
          style={{
            gridTemplateRows: `repeat(${total_u}, minmax(0, 1fr))`,
            gap: '1px', 
          }}
        >
          {assets.map(asset => {
            // Validate start_u and size_u before rendering
            if (asset.start_u === null || asset.start_u === undefined || asset.start_u <= 0 ||
                asset.size_u === null || asset.size_u === undefined || asset.size_u <= 0 ||
                (asset.start_u + asset.size_u -1) > total_u ) {
              console.warn(`Asset "${asset.name || asset.id}" has invalid U positioning (start_u: ${asset.start_u}, size_u: ${asset.size_u}, total_u: ${total_u}) and will not be rendered.`);
              return null;
            }
            
            const topMostUFromBottom = asset.start_u + asset.size_u - 1;
            const gridRowStart = total_u - topMostUFromBottom + 1;

            return (
              <div
                key={asset.id}
                onClick={() => onAssetSelect(asset.id)}
                title={`${asset.name || 'Unnamed Asset'} (Size: ${asset.size_u}U, Start U: ${asset.start_u})`}
                className={cn(
                  "bg-primary/20 hover:bg-primary/40 border border-purple-500/30 rounded flex items-center justify-center p-1 text-xs text-center cursor-pointer transition-all duration-200 ease-in-out text-gray-50 overflow-hidden",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400",
                  asset.id === selectedAssetId && "ring-2 ring-offset-2 ring-offset-background ring-purple-400 neon-glow-primary bg-primary/50 shadow-lg"
                )}
                style={{
                  gridRowStart: gridRowStart,
                  gridRowEnd: `span ${asset.size_u}`,
                  minHeight: `calc(${asset.size_u * 2}rem - 1px*(${asset.size_u - 1}))`, 
                  zIndex: asset.id === selectedAssetId ? 10 : 1, 
                }}
              >
                <span className="truncate">{asset.name || 'Unnamed Asset'}</span>
              </div>
            );
          })}
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
