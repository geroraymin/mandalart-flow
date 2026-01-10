import { motion } from 'framer-motion';
import { Cell } from '@/types/mandalart';
import { Target, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

interface DashboardStatsProps {
  cells: Cell[];
}

export function DashboardStats({ cells }: DashboardStatsProps) {
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
      label: '진행 중 목표',
      value: `${activeCells}개`,
      icon: TrendingUp,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: '작성된 셀',
      value: `${filledCells}/${totalCells}`,
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sub-goal Progress Bars */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-xl p-4 shadow-sm"
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          중간 목표별 달성률
        </h3>
        <div className="space-y-3">
          {subGoalProgress.map((goal, index) => (
            <div key={goal.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[200px]">
                  {index + 1}. {goal.content}
                </span>
                <span className="font-medium">{goal.progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress}%` }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                  className="h-full progress-gradient rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
