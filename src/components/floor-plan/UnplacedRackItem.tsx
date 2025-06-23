
'use client';

import { Button } from '@/components/ui/button';
import { Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Rack {
  id: string;
  name: string;
}

interface UnplacedRackItemProps {
  rack: Rack;
  onClick: () => void;
  isSelected: boolean;
}

export function UnplacedRackItem({ rack, onClick, isSelected }: UnplacedRackItemProps) {
  return (
    <Button
      variant={isSelected ? "secondary" : "ghost"}
      onClick={onClick}
      className="w-full justify-start gap-2"
    >
      <Server className="h-4 w-4 text-sky-400" />
      <span className="text-sm text-gray-200 truncate">{rack.name}</span>
    </Button>
  );
}
