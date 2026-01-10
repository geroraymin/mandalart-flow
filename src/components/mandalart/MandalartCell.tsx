import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cell, CellLevel } from '@/types/mandalart';
import { cn } from '@/lib/utils';

interface MandalartCellProps {
  cell: Cell;
  onContentChange: (cellId: string, content: string) => void;
  onCellClick: (cell: Cell) => void;
  delay?: number;
}

export function MandalartCell({ 
  cell, 
  onContentChange, 
  onCellClick,
  delay = 0 
}: MandalartCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(cell.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(cell.content);
  }, [cell.content]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== cell.content) {
      onContentChange(cell.id, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(cell.content);
      setIsEditing(false);
    }
  };

  const getCellStyles = (level: CellLevel): string => {
    switch (level) {
      case 'CENTER':
        return 'bg-primary text-primary-foreground font-semibold shadow-lg';
      case 'SUB_CENTER':
        return 'bg-primary/20 text-foreground font-medium';
      case 'LEAF':
      default:
        return 'bg-card text-foreground hover:bg-secondary/50';
    }
  };

  const progressPercentage = cell.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: delay * 0.01 }}
      className={cn(
        'relative aspect-square flex items-center justify-center p-1.5 rounded-md cursor-pointer transition-all duration-200',
        'border border-border/50 overflow-hidden',
        getCellStyles(cell.level),
        isEditing && 'ring-2 ring-primary ring-offset-1'
      )}
      onClick={() => !isEditing && onCellClick(cell)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {/* Progress background fill */}
      {progressPercentage > 0 && cell.level !== 'CENTER' && (
        <div 
          className="absolute bottom-0 left-0 right-0 progress-gradient opacity-30 transition-all duration-500"
          style={{ height: `${progressPercentage}%` }}
        />
      )}
      
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full h-full bg-transparent text-center text-xs resize-none',
            'focus:outline-none z-10',
            cell.level === 'CENTER' && 'text-primary-foreground placeholder:text-primary-foreground/50',
            cell.level !== 'CENTER' && 'text-foreground placeholder:text-muted-foreground'
          )}
          placeholder={cell.level === 'CENTER' ? '핵심 목표' : cell.level === 'SUB_CENTER' ? '중간 목표' : '세부 목표'}
        />
      ) : (
        <span className={cn(
          'text-[10px] md:text-xs text-center leading-tight break-words line-clamp-3 z-10',
          !cell.content && 'opacity-40'
        )}>
          {cell.content || (cell.level === 'CENTER' ? '핵심 목표' : cell.level === 'SUB_CENTER' ? '중간 목표' : '+')}
        </span>
      )}

      {/* Progress indicator dot */}
      {progressPercentage > 0 && cell.level !== 'CENTER' && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full progress-gradient" />
      )}
    </motion.div>
  );
}
