
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RackVisualizer } from './RackVisualizer';
import { AssetDetailPanel } from './AssetDetailPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react';
import type { RackWithAssetsAndPorts, AssetWithPorts } from '@/lib/database.types';

interface RackDetailViewProps {
  rackData: RackWithAssetsAndPorts;
}

export function RackDetailView({ rackData }: RackDetailViewProps) {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
  };

  const selectedAsset = rackData.assets.find(asset => asset.id === selectedAssetId) || null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-gray-50">
            {rackData.name || 'Detalles del Rack'}
          </h1>
          <p className="text-gray-400">{rackData.description || 'Visualiza y gestiona los activos de este rack.'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/racks">
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Lista de Racks
            </Button>
          </Link>
          {/* Placeholder for Edit/Delete buttons */}
          {/* <Button variant="outline" size="icon" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="destructiveOutline" size="icon" className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </Button> */}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 xl:w-1/4">
          <RackVisualizer
            total_u={rackData.total_u}
            assets={rackData.assets}
            selectedAssetId={selectedAssetId}
            onAssetSelect={handleAssetSelect}
          />
        </div>
        <div className="lg:w-2/3 xl:w-3/4">
          <AssetDetailPanel asset={selectedAsset} />
        </div>
      </div>
    </div>
  );
}
