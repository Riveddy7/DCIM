
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RackVisualizer } from './RackVisualizer';
import { AssetDetailPanel } from './AssetDetailPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { RackWithAssetsAndPorts } from '@/lib/database.types';
import { useRouter, useSearchParams } from 'next/navigation';

interface RackDetailViewProps {
  rackData: RackWithAssetsAndPorts;
  tenantId: string;
}

export function RackDetailView({ rackData, tenantId }: RackDetailViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const highlightedAssetId = searchParams.get('highlightAsset');

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(highlightedAssetId);
  const [addingAssetSlot, setAddingAssetSlot] = useState<number | null>(null);

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    setAddingAssetSlot(null);
  };

  const handleStartAddAsset = (uSlot: number) => {
    setSelectedAssetId(null);
    setAddingAssetSlot(uSlot);
  };

  const handleAssetCreateSuccess = () => {
    setAddingAssetSlot(null);
    router.refresh();
  };
  
  const handleCancelAddAsset = () => {
    setAddingAssetSlot(null);
  };

  const assetsArray = Array.isArray(rackData.assets) ? rackData.assets : [];
  const selectedAsset = assetsArray.find(asset => asset.id === selectedAssetId) || null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-purple-500">
            {rackData.name || 'Detalles del Rack'}
          </h1>
          <p className="text-gray-50">{rackData.notes || ''}</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          <RackVisualizer
            total_u={rackData.total_u}
            assets={assetsArray}
            selectedAssetId={selectedAssetId}
            onAssetSelect={handleAssetSelect}
            onAddAssetClick={handleStartAddAsset}
          />
        </div>
        <div className="lg:w-1/2">
          <AssetDetailPanel
            asset={selectedAsset}
            rackAssets={assetsArray}
            tenantId={tenantId}
            rackId={rackData.id}
            rackLocationId={rackData.location_id}
            addingAssetSlot={addingAssetSlot}
            onAssetCreateSuccess={handleAssetCreateSuccess}
            onCancelAddAsset={handleCancelAddAsset}
          />
        </div>
      </div>
    </div>
  );
}
