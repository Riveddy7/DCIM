'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function FloorPlanSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Main canvas skeleton */}
      <div className="flex-grow">
        <Skeleton className="w-full aspect-video rounded-lg" />
      </div>
      
      {/* Sidebar skeleton */}
      <div className="w-full md:w-64">
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}