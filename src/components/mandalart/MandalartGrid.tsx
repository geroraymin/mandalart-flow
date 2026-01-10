import { Cell } from '@/types/mandalart';
import { MandalartCell } from './MandalartCell';
import { motion } from 'framer-motion';

interface MandalartGridProps {
  cells: Cell[];
  onContentChange: (cellId: string, content: string) => void;
  onCellClick: (cell: Cell) => void;
}

export function MandalartGrid({ cells, onContentChange, onCellClick }: MandalartGridProps) {
  // Sort cells by position
  const sortedCells = [...cells].sort((a, b) => a.position - b.position);

  // Group cells into 9 sub-grids (3x3 arrangement of 3x3 grids)
  const getSubGrids = () => {
    const subGrids: Cell[][] = Array.from({ length: 9 }, () => []);
    
    sortedCells.forEach((cell) => {
      const row = Math.floor(cell.position / 9);
      const col = cell.position % 9;
      const subGridRow = Math.floor(row / 3);
      const subGridCol = Math.floor(col / 3);
      const subGridIndex = subGridRow * 3 + subGridCol;
      subGrids[subGridIndex].push(cell);
    });
    
    return subGrids;
  };

  const subGrids = getSubGrids();

  const getSubGridBgClass = (index: number): string => {
    // Center sub-grid (index 4) is the main goal area
    if (index === 4) {
      return 'bg-primary/10';
    }
    return 'bg-card/50';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* 3x3 Grid of Sub-Grids with borders */}
      <div className="grid grid-cols-3 gap-1 md:gap-2 p-2 md:p-4 bg-border rounded-xl shadow-lg">
        {subGrids.map((subGrid, subGridIndex) => (
          <div 
            key={subGridIndex}
            className={`grid grid-cols-3 gap-0.5 p-1 md:p-1.5 rounded-lg ${getSubGridBgClass(subGridIndex)}`}
          >
            {subGrid
              .sort((a, b) => {
                // Sort within sub-grid by local position
                const aRow = Math.floor(a.position / 9) % 3;
                const aCol = a.position % 3;
                const bRow = Math.floor(b.position / 9) % 3;
                const bCol = b.position % 3;
                return (aRow * 3 + aCol) - (bRow * 3 + bCol);
              })
              .map((cell, cellIndex) => (
                <MandalartCell
                  key={cell.id}
                  cell={cell}
                  onContentChange={onContentChange}
                  onCellClick={onCellClick}
                  delay={subGridIndex * 9 + cellIndex}
                />
              ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>핵심 목표</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/20" />
          <span>중간 목표</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-card border" />
          <span>세부 목표</span>
        </div>
      </div>
    </motion.div>
  );
}
