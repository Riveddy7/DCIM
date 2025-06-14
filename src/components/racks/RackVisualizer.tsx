
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
  // Create U markers from 1 (top) to total_u (bottom)
  const uMarkers = Array.from({ length: total_u }, (_, i) => i + 1);

  return (
    <div className="glassmorphic-card p-4">
      <h3 className="font-headline text-lg text-gray-200 mb-4 text-center">Visualización del Rack</h3>
      {/* Main flex container for markers and asset area - removed gap-2 */}
      <div className="flex" style={{ minHeight: `${total_u * 2.25}rem` }}>
        {/* Left U Markers */}
        <div className="flex flex-col justify-between items-center text-xs text-gray-400 pr-2 border-r border-purple-500/20 select-none">
          {uMarkers.map(u => (
            <div key={`marker-left-${u}`} className="h-8 flex items-center">
              {u}
            </div>
          ))}
        </div>

        {/* Asset Area */}
        <div
          className="relative flex-grow grid" // flex-grow should make this take available space
          style={{
            gridTemplateRows: `repeat(${total_u}, minmax(0, 1fr))`,
            gap: '1px', // This is row-gap
          }}
        >
          {/* Render empty U slots first as background guides */}
          {uMarkers.map(uRow => (
             <div
                key={`empty-u-${uRow}`}
                className="border-b border-dashed border-gray-700/30"
                style={{ gridRowStart: uRow, gridRowEnd: uRow + 1, minHeight: '2rem', zIndex: 0}}
             />
           ))}
          {assets.map(asset => {
            // Validate asset positioning (1-indexed from top)
            if (asset.start_u === null || asset.start_u === undefined || asset.start_u <= 0 ||
                asset.size_u === null || asset.size_u === undefined || asset.size_u <= 0 ||
                (asset.start_u + asset.size_u - 1) > total_u ) {
              console.warn(`Asset "${asset.name || asset.id}" has invalid U positioning (start_u: ${asset.start_u}, size_u: ${asset.size_u}, total_u: ${total_u}) for top-down numbering and will not be rendered.`);
              return null;
            }

            const gridRowStart = asset.start_u;

            return (
              <div
                key={asset.id}
                onClick={() => onAssetSelect(asset.id)}
                title={`${asset.name || 'Unnamed Asset'} (Size: ${asset.size_u}U, Start U (from top): ${asset.start_u})`}
                className={cn(
                  "w-full bg-primary/20 hover:bg-primary/40 border border-purple-500/30 rounded p-1 text-xs cursor-pointer transition-all duration-200 ease-in-out text-gray-50 overflow-hidden",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400",
                  asset.id === selectedAssetId && "ring-2 ring-offset-2 ring-offset-background ring-purple-400 neon-glow-primary bg-primary/50 shadow-lg"
                )}
                style={{
                  gridRowStart: gridRowStart,
                  gridRowEnd: `span ${asset.size_u}`,
                  minHeight: `calc(${asset.size_u * 2}rem - ${(asset.size_u - 1) * 1}px)`, // 1px for the gap
                  zIndex: asset.id === selectedAssetId ? 10 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="truncate">{asset.name || 'Unnamed Asset'}</span>
              </div>
            );
          })}
        </div>

        {/* Right U Markers */}
        <div className="flex flex-col justify-between items-center text-xs text-gray-400 pl-2 border-l border-purple-500/20 select-none">
          {uMarkers.map(u => (
            <div key={`marker-right-${u}`} className="h-8 flex items-center">
              {u}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
