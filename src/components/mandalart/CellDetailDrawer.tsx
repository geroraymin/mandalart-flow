import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Target, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Cell, ActionPlan, ActionLog } from '@/types/mandalart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CellDetailDrawerProps {
  cell: Cell | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function CellDetailDrawer({ cell, isOpen, onClose, onUpdate }: CellDetailDrawerProps) {
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Form state
  const [planType, setPlanType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [targetCount, setTargetCount] = useState(1);

  useEffect(() => {
    if (cell && isOpen) {
      fetchActionPlan();
    }
  }, [cell, isOpen]);

  const fetchActionPlan = async () => {
    if (!cell) return;
    setLoading(true);

    try {
      const { data: plans, error: planError } = await supabase
        .from('action_plans')
        .select('*')
        .eq('cell_id', cell.id)
        .limit(1);

      if (planError) throw planError;

      if (plans && plans.length > 0) {
        const plan = plans[0] as ActionPlan;
        setActionPlan(plan);
        setPlanType(plan.type);
        setTargetCount(plan.target_count);

        // Fetch logs for this plan
        const { data: logs, error: logsError } = await supabase
          .from('action_logs')
          .select('*')
          .eq('action_plan_id', plan.id);

        if (logsError) throw logsError;
        setActionLogs((logs || []) as ActionLog[]);
      } else {
        setActionPlan(null);
        setActionLogs([]);
      }
    } catch (error) {
      console.error('Error fetching action plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const createActionPlan = async () => {
    if (!cell) return;

    try {
      const { data, error } = await supabase
        .from('action_plans')
        .insert({
          cell_id: cell.id,
          type: planType,
          target_count: targetCount,
          start_date: format(new Date(), 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (error) throw error;
      setActionPlan(data as ActionPlan);
      toast.success('Action plan created!');
      onUpdate();
    } catch (error) {
      console.error('Error creating action plan:', error);
      toast.error('Failed to create plan');
    }
  };

  const toggleLog = async (date: Date) => {
    if (!actionPlan) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const existingLog = actionLogs.find(log => log.log_date === dateStr);

    try {
      if (existingLog) {
        // Delete the log
        const { error } = await supabase
          .from('action_logs')
          .delete()
          .eq('id', existingLog.id);

        if (error) throw error;
        setActionLogs(prev => prev.filter(log => log.id !== existingLog.id));
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('action_logs')
          .insert({
            action_plan_id: actionPlan.id,
            log_date: dateStr,
            status: 'DONE',
          })
          .select()
          .single();

        if (error) throw error;
        setActionLogs(prev => [...prev, data as ActionLog]);
      }

      // Update cell progress
      await updateCellProgress();
      onUpdate();
    } catch (error) {
      console.error('Error toggling log:', error);
      toast.error('Failed to update');
    }
  };

  const updateCellProgress = async () => {
    if (!cell || !actionPlan) return;

    // Calculate progress based on logs in current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const logsThisMonth = actionLogs.filter(log => {
      const logDate = new Date(log.log_date);
      return isSameMonth(logDate, currentMonth);
    });

    const progress = Math.min(100, (logsThisMonth.length / daysInMonth.length) * 100);

    try {
      await supabase
        .from('cells')
        .update({ progress })
        .eq('id', cell.id);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const daysInCurrentMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const isDateLogged = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return actionLogs.some(log => log.log_date === dateStr);
  };

  if (!cell) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    cell.level === 'CENTER' && 'bg-primary text-primary-foreground',
                    cell.level === 'SUB_CENTER' && 'bg-primary/20 text-primary',
                    cell.level === 'LEAF' && 'bg-secondary text-secondary-foreground'
                  )}>
                    {cell.level === 'CENTER' ? '핵심 목표' : cell.level === 'SUB_CENTER' ? '중간 목표' : '세부 목표'}
                  </span>
                  <h2 className="text-xl font-semibold mt-2">
                    {cell.content || '(비어있음)'}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">달성률</span>
                  <span className="text-lg font-semibold">{Math.round(cell.progress)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${cell.progress}%` }}
                    className="h-full progress-gradient"
                  />
                </div>
              </div>

              {/* Action Plan Section */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
              ) : actionPlan ? (
                <div className="space-y-6">
                  {/* Plan Info */}
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="font-medium">실천 계획</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {actionPlan.type === 'DAILY' && '매일'}
                      {actionPlan.type === 'WEEKLY' && '매주'}
                      {actionPlan.type === 'MONTHLY' && '매월'}
                      {' '}목표: {actionPlan.target_count}회
                    </p>
                  </div>

                  {/* Calendar */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <h3 className="font-medium">
                        {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                        <div key={day} className="text-xs text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                      
                      {/* Empty cells for alignment */}
                      {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      
                      {daysInCurrentMonth.map(date => {
                        const logged = isDateLogged(date);
                        const isPast = isBefore(date, new Date()) || isToday(date);
                        
                        return (
                          <button
                            key={date.toISOString()}
                            onClick={() => isPast && toggleLog(date)}
                            disabled={!isPast}
                            className={cn(
                              'aspect-square flex items-center justify-center rounded-lg text-sm transition-all',
                              isToday(date) && 'ring-2 ring-primary ring-offset-1',
                              logged && 'bg-accent text-accent-foreground',
                              !logged && isPast && 'hover:bg-secondary',
                              !isPast && 'opacity-30 cursor-not-allowed'
                            )}
                          >
                            {logged ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span>{format(date, 'd')}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{actionLogs.length}</div>
                      <div className="text-xs text-muted-foreground">총 실천 횟수</div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-accent">
                        {actionLogs.filter(log => {
                          const logDate = new Date(log.log_date);
                          return isSameMonth(logDate, currentMonth);
                        }).length}
                      </div>
                      <div className="text-xs text-muted-foreground">이번달 실천</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium mb-2">실천 계획 만들기</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      이 목표를 달성하기 위한 실천 계획을 설정하세요
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>반복 주기</Label>
                      <Select value={planType} onValueChange={(v) => setPlanType(v as typeof planType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DAILY">매일</SelectItem>
                          <SelectItem value="WEEKLY">매주</SelectItem>
                          <SelectItem value="MONTHLY">매월</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>목표 횟수</Label>
                      <Input
                        type="number"
                        min={1}
                        value={targetCount}
                        onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <Button onClick={createActionPlan} className="w-full">
                      계획 만들기
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
