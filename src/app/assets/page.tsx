
import { Suspense } from 'react';
import AssetsPageClient from './AssetsPageClient';
import { Loader2 } from 'lucide-react';

function AssetsPageSkeleton() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
}

export default function AssetsPage() {
  return (
    <Suspense fallback={<AssetsPageSkeleton />}>
      <AssetsPageClient />
    </Suspense>
  );
}
