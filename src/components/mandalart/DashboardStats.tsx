import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cell } from '@/types/mandalart';
import { Target, TrendingUp, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DashboardStatsProps {
  cells: Cell[];
}

export function DashboardStats({ cells }: DashboardStatsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate statistics
  const centerCell = cells.find(c => c.level === 'CENTER');
  const subCenterCells = cells.filter(c => c.level === 'SUB_CENTER');
  const leafCells = cells.filter(c => c.level === 'LEAF');

  // Overall progress (average of sub-center cells, or center cell progress)
  const overallProgress = centerCell?.progress || 
    (subCenterCells.length > 0 
      ? subCenterCells.reduce((sum, c) => sum + (c.progress || 0), 0) / subCenterCells.length 
      : 0);

  // Count cells with content
  const filledCells = cells.filter(c => c.content).length;
  const totalCells = cells.length;
  const completionRate = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

  // Count cells with progress > 0
  const activeCells = cells.filter(c => (c.progress || 0) > 0).length;

  // Calculate sub-goal progress
  const subGoalProgress = subCenterCells.map(cell => ({
    id: cell.id,
    content: cell.content || '미입력',
    progress: cell.progress || 0,
    position: cell.position,
  }));

  const stats = [
    {
      label: '전체 달성률',
      value: `${overallProgress.toFixed(1)}%`,
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '목표 작성률',
      value: `${completionRate.toFixed(0)}%`,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: '진행 중',
      value: `${activeCells}개`,
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: '작성됨',
      value: `${filledCells}/${totalCells}`,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-4">
      {/* Stats Cards - More compact */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-lg p-2.5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
                <p className="text-sm font-bold leading-tight">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Collapsible Sub-goal Progress */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full bg-card border border-border rounded-lg p-3 shadow-sm flex items-center justify-between hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">중간목표별 달성률</span>
              <span className="text-xs text-muted-foreground">
                ({subGoalProgress.filter(g => g.progress > 0).length}/{subGoalProgress.length} 진행 중)
              </span>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </motion.button>
        </CollapsibleTrigger>
        
        <AnimatePresence>
          {isOpen && (
            <CollapsibleContent forceMount asChild>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {subGoalProgress.map((goal, index) => (
                    <div 
                      key={goal.id} 
                      className="bg-card border border-border rounded-lg p-2.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]" title={goal.content}>
                          {goal.content}
                        </span>
                        <span className="text-xs font-semibold text-foreground ml-1">
                          {goal.progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${goal.progress}%` }}
                          transition={{ duration: 0.4, delay: index * 0.03 }}
                          className="h-full progress-gradient rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    </div>
  );
}
