'use client';

import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useToast } from '@/hooks/use-toast';

interface FloorPlanKeyboardShortcutsProps {
  isEditMode: boolean;
  selectedRacks: string[];
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleEditMode: () => void;
  onUndo?: () => void;
}

export function FloorPlanKeyboardShortcuts({
  isEditMode,
  selectedRacks,
  onDeleteSelected,
  onSelectAll,
  onDeselectAll,
  onToggleEditMode,
  onUndo
}: FloorPlanKeyboardShortcutsProps) {
  const { toast } = useToast();

  // Delete selected racks
  useHotkeys(
    'delete,backspace',
    () => {
      if (isEditMode && selectedRacks.length > 0) {
        onDeleteSelected();
        toast({
          title: 'Racks eliminados del plano',
          description: `${selectedRacks.length} rack(s) devueltos a la paleta.`,
        });
      }
    },
    { enabled: isEditMode && selectedRacks.length > 0 },
    [isEditMode, selectedRacks, onDeleteSelected]
  );

  // Select all racks
  useHotkeys(
    'ctrl+a,cmd+a',
    (e) => {
      e.preventDefault();
      onSelectAll();
      toast({
        title: 'Todos los racks seleccionados',
      });
    },
    { preventDefault: true },
    [onSelectAll]
  );

  // Deselect all racks
  useHotkeys(
    'escape',
    () => {
      if (selectedRacks.length > 0) {
        onDeselectAll();
        toast({
          title: 'Selección cancelada',
        });
      }
    },
    { enabled: selectedRacks.length > 0 },
    [selectedRacks, onDeselectAll]
  );

  // Toggle edit mode
  useHotkeys(
    'e',
    () => {
      onToggleEditMode();
      toast({
        title: isEditMode ? 'Modo de edición desactivado' : 'Modo de edición activado',
      });
    },
    [isEditMode, onToggleEditMode]
  );

  // Undo (if available)
  useHotkeys(
    'ctrl+z,cmd+z',
    (e) => {
      e.preventDefault();
      if (onUndo) {
        onUndo();
        toast({
          title: 'Acción deshecha',
        });
      }
    },
    { enabled: !!onUndo, preventDefault: true },
    [onUndo]
  );

  // Show help
  useHotkeys(
    '?',
    () => {
      toast({
        title: 'Atajos de teclado',
        description: (
          <div className="space-y-1 text-sm">
            <div><kbd>E</kbd> - Alternar modo edición</div>
            <div><kbd>Ctrl+A</kbd> - Seleccionar todos</div>
            <div><kbd>Escape</kbd> - Deseleccionar</div>
            <div><kbd>Delete</kbd> - Eliminar seleccionados</div>
            <div><kbd>Ctrl+Z</kbd> - Deshacer</div>
            <div><kbd>?</kbd> - Mostrar ayuda</div>
          </div>
        ),
      });
    },
    [toast]
  );

  return null; // This component doesn't render anything
}