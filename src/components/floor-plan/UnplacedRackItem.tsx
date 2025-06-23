
'use client';

import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Rack {
  id: string;
  name: string;
}

interface UnplacedRackItemProps {
  rack: Rack;
}

export function UnplacedRackItem({ rack }: UnplacedRackItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: rack.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100, // Make sure it's on top while dragging
    } : undefined;

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={cn(
                "p-2 rounded-md flex items-center gap-2 bg-gray-500/20 border border-gray-500/30 cursor-grab",
                isDragging && "z-50 shadow-lg bg-primary/50"
            )}
        >
            <div {...listeners} {...attributes} className="flex items-center gap-2 w-full">
                <GripVertical className="h-5 w-5 text-gray-400" />
                <Server className="h-4 w-4 text-sky-400" />
                <span className="text-sm text-gray-200 truncate">{rack.name}</span>
            </div>
        </div>
    );
}
