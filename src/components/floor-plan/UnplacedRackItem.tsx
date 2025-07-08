
'use client';

import { Button } from '@/components/ui/button';
import { Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Button
        variant={isSelected ? "secondary" : "ghost"}
        onClick={onClick}
        className={cn(
          "w-full justify-start gap-2 transition-all duration-200",
          isSelected && "ring-2 ring-primary/50 bg-primary/20",
          "hover:bg-primary/10 hover:border-primary/30"
        )}
      >
        <motion.div
          animate={isSelected ? { rotate: [0, 360] } : {}}
          transition={{ duration: 0.5 }}
        >
          <Server className={cn("h-4 w-4", isSelected ? "text-primary" : "text-sky-400")} />
        </motion.div>
        <span className={cn("text-sm truncate", isSelected ? "text-primary-foreground" : "text-gray-200")}>
          {rack.name}
        </span>
      </Button>
    </motion.div>
  );
}
