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

  // Group cells into 3x3 sub-grids for visual separation
  const getSubGridClasses = (position: number): string => {
    const row = Math.floor(position / 9);
    const col = position % 9;
    const subRow = Math.floor(row / 3);
    const subCol = Math.floor(col / 3);
    
    // Center sub-grid (the main goal area)
    if (subRow === 1 && subCol === 1) {
      return 'bg-primary/5';
    }
    
    return '';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-9 gap-0.5 md:gap-1 p-2 md:p-4 bg-border/30 rounded-xl grid-shadow">
        {sortedCells.map((cell, index) => (
          <div key={cell.id} className={getSubGridClasses(cell.position)}>
            <MandalartCell
              cell={cell}
              onContentChange={onContentChange}
              onCellClick={onCellClick}
              delay={index}
            />
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
