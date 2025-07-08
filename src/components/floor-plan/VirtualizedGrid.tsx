'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion } from 'framer-motion';

interface VirtualizedGridProps {
  cols: number;
  rows: number;
  cellSize: number;
  children: (props: { x: number; y: number; style: any }) => React.ReactNode;
  containerWidth: number;
  containerHeight: number;
  isEditMode?: boolean;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: any;
  data: {
    cols: number;
    renderCell: (props: { x: number; y: number; style: any }) => React.ReactNode;
  };
}

const Cell = ({ columnIndex, rowIndex, style, data }: CellProps) => {
  const x = columnIndex + 1;
  const y = rowIndex + 1;

  return (
    <div style={style}>
      {data.renderCell({ x, y, style })}
    </div>
  );
};

export function VirtualizedGrid({
  cols,
  rows,
  cellSize,
  children,
  containerWidth,
  containerHeight,
  isEditMode = false
}: VirtualizedGridProps) {
  const gridRef = useRef<Grid>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Only use virtualization for large grids (performance threshold)
  const shouldVirtualize = useMemo(() => {
    const totalCells = cols * rows;
    return totalCells > 2000; // Virtualize grids with more than 2000 cells
  }, [cols, rows]);

  const itemData = useMemo(() => ({
    cols,
    renderCell: children
  }), [cols, children]);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    const timeoutId = setTimeout(() => setIsScrolling(false), 150);
    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-scroll to center when in edit mode
  useEffect(() => {
    if (isEditMode && gridRef.current && shouldVirtualize) {
      const centerCol = Math.floor(cols / 2);
      const centerRow = Math.floor(rows / 2);
      
      gridRef.current.scrollToItem({
        columnIndex: centerCol,
        rowIndex: centerRow,
        align: 'center'
      });
    }
  }, [isEditMode, cols, rows, shouldVirtualize]);

  if (!shouldVirtualize) {
    // For small grids, render normally without virtualization
    return (
      <motion.div
        className="grid gap-0.5 md:gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {Array.from({ length: cols * rows }).map((_, index) => {
          const x = (index % cols) + 1;
          const y = Math.floor(index / cols) + 1;
          
          return (
            <div key={`cell-${x}-${y}`}>
              {children({ x, y, style: {} })}
            </div>
          );
        })}
      </motion.div>
    );
  }

  // For large grids, use react-window virtualization
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Virtualization info overlay */}
      {isScrolling && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 left-4 z-20 bg-black/70 text-white px-3 py-1 rounded text-sm"
        >
          Grid virtualizado ({cols}×{rows})
        </motion.div>
      )}
      
      <Grid
        ref={gridRef}
        className="virtualized-grid"
        columnCount={cols}
        columnWidth={cellSize}
        height={containerHeight}
        rowCount={rows}
        rowHeight={cellSize}
        width={containerWidth}
        itemData={itemData}
        onScroll={handleScroll}
        overscanColumnCount={5}
        overscanRowCount={5}
      >
        {Cell}
      </Grid>
    </motion.div>
  );
}