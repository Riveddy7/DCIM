
'use client';

import { cn } from '@/lib/utils';
import type { AssetWithPorts } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface RackVisualizerProps {
  total_u: number;
  assets: AssetWithPorts[];
  selectedAssetId: string | null;
  onAssetSelect: (assetId: string) => void;
  onAddAssetClick: (uSlot: number) => void;
}

export function RackVisualizer({ total_u, assets, selectedAssetId, onAssetSelect, onAddAssetClick }: RackVisualizerProps) {
  const uMarkers = Array.from({ length: total_u }, (_, i) => i + 1);
  const uHeightRem = 2.25; // Height of each U slot

  // Function to get asset type colors
  const getAssetTypeColor = (assetType: string | null): string => {
    if (!assetType) return 'bg-gray-500/20 border-gray-500/30 hover:bg-gray-500/40'; // default
    
    const type = assetType.toUpperCase();
    
    // Server types - AZUL
    if (type.includes('SERVER') || type === 'SERVIDOR') {
      return 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/40';
    }
    // Switch types - MORADO
    else if (type.includes('SWITCH') || type === 'CONMUTADOR') {
      return 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/40';
    }
    // Patch Panel types - NEGRO
    else if (type.includes('PATCH') || type.includes('PANEL') || type === 'PATCH_PANEL') {
      return 'bg-gray-900/60 border-gray-700/70 hover:bg-gray-800/80';
    }
    // PDU types - GRIS
    else if (type.includes('PDU') || type === 'DISTRIBUIDOR' || type.includes('POWER')) {
      return 'bg-gray-500/30 border-gray-400/50 hover:bg-gray-400/50';
    }
    // UPS types - ROJO
    else if (type.includes('UPS') || type === 'SAI') {
      return 'bg-red-500/20 border-red-500/30 hover:bg-red-500/40';
    }
    // Organizer types - GRIS OSCURO
    else if (type.includes('ORGANIZADOR') || type.includes('ORGANIZER') || type.includes('CABLE')) {
      return 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-600/50';
    }
    // BLANCK type - Tratarlo como organizador (gris oscuro)
    else if (type === 'BLANCK' || type === 'BLANK') {
      return 'bg-gray-700/30 border-gray-600/50 hover:bg-gray-600/50';
    }
    // Default for unknown types
    else {
      return 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/40';
    }
  };

  const occupiedUs = new Set<number>();
  assets.forEach(asset => {
    if (asset.start_u !== null && asset.size_u !== null && asset.start_u > 0 && asset.size_u > 0) {
      for (let i = 0; i < asset.size_u; i++) {
        occupiedUs.add(asset.start_u + i);
      }
    }
  });

  return (
    <div className="glassmorphic-card-static p-4">
      <h3 className="font-headline text-lg text-gray-200 mb-4 text-center">Visualización del Rack</h3>
      <div className="flex">
        {/* Left U Markers */}
        <div className="flex flex-col justify-between items-center text-xs text-gray-400 pr-2 border-r border-purple-500/20 select-none" style={{ minHeight: `${total_u * uHeightRem}rem` }}>
          {uMarkers.map(u => (
            <div key={`marker-left-${u}`} style={{ height: `${uHeightRem}rem` }} className="flex items-center">
              {u}
            </div>
          ))}
        </div>

        {/* Asset Area */}
        <div
          className="relative flex-grow grid"
          style={{
            gridTemplateColumns: '1fr',
            gridTemplateRows: `repeat(${total_u}, minmax(0, 1fr))`,
            gap: '1px', // Row-gap for visual separation
            minHeight: `${total_u * uHeightRem}rem`
          }}
        >
          {/* Background U slots & Add Buttons */}
          {uMarkers.map(uRow => {
            const isOccupied = occupiedUs.has(uRow);
            let isPartOfMultiUAsset = false;
            if (isOccupied) {
              // Check if this U is occupied by an asset that started on a previous U
              isPartOfMultiUAsset = assets.some(asset => 
                asset.start_u !== null && asset.size_u !== null &&
                uRow > asset.start_u && uRow < (asset.start_u + asset.size_u)
              );
            }

            return (
              <div
                key={`slot-row-${uRow}`}
                className={cn(
                  "border-b border-dashed border-gray-700/30 relative",
                  { "cursor-pointer hover:bg-gray-700/20": !isOccupied }
                )}
                style={{ gridRowStart: uRow, gridRowEnd: uRow + 1, minHeight: `${uHeightRem}rem`, zIndex: 0 }}
                onClick={() => !isOccupied && onAddAssetClick(uRow)}
              >
                {!isOccupied && (
                  <Button
                    variant="ghost"
                    className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-500 hover:text-gray-300 bg-gray-500/10 hover:bg-gray-500/20 p-0"
                    aria-label={`Añadir activo en U ${uRow}`}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                )}
              </div>
            );
          })}

          {/* Render Assets */}
          {assets.map(asset => {
            if (asset.start_u === null || asset.start_u === undefined || asset.start_u <= 0 ||
                asset.size_u === null || asset.size_u === undefined || asset.size_u <= 0 ||
                (asset.start_u + asset.size_u - 1) > total_u ) {
              console.warn(`Asset "${asset.name || asset.id}" has invalid U positioning for top-down numbering.`);
              return null;
            }
            const gridRowStart = asset.start_u;

            return (
              <div
                key={asset.id}
                onClick={() => onAssetSelect(asset.id)}
                title={`${asset.name || 'Unnamed Asset'} (Size: ${asset.size_u}U, Start U: ${asset.start_u})`}
                className={cn(
                  "w-full rounded p-1 text-xs cursor-pointer transition-all duration-200 ease-in-out text-gray-50 overflow-hidden",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400",
                  getAssetTypeColor(asset.asset_type),
                  asset.id === selectedAssetId && "ring-2 ring-offset-2 ring-offset-background ring-purple-400 shadow-lg"
                )}
                style={{
                  gridRowStart: gridRowStart,
                  gridRowEnd: `span ${asset.size_u}`,
                  gridColumnStart: 1, 
                  minHeight: `calc(${asset.size_u * uHeightRem}rem - ${(asset.size_u -1) * 1}px)`, // Adjust for gap
                  zIndex: asset.id === selectedAssetId ? 10 : 5, // Assets above add buttons
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
        <div className="flex flex-col justify-between items-center text-xs text-gray-400 pl-2 border-l border-purple-500/20 select-none" style={{ minHeight: `${total_u * uHeightRem}rem` }}>
          {uMarkers.map(u => (
            <div key={`marker-right-${u}`} style={{ height: `${uHeightRem}rem` }} className="flex items-center">
              {u}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

    