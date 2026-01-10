import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMandalart } from '@/hooks/useMandalart';
import { Header } from '@/components/Header';
import { MandalartGrid } from '@/components/mandalart/MandalartGrid';
import { CellDetailDrawer } from '@/components/mandalart/CellDetailDrawer';
import { Cell } from '@/types/mandalart';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { mandalart, cells, loading: dataLoading, updateCellContent, updateMandalartTitle, refreshCells } = useMandalart();
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleCellClick = (cell: Cell) => {
    setSelectedCell(cell);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedCell(null);
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">만다라트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title={mandalart?.title || 'My Goals'} 
        onTitleChange={updateMandalartTitle}
      />
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        {cells.length > 0 && !cells.some(c => c.content) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 p-6 bg-secondary/30 rounded-2xl"
          >
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">만다라트에 오신 것을 환영합니다!</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              중앙의 <span className="text-primary font-medium">핵심 목표</span>부터 시작하세요.
              셀을 더블클릭하여 목표를 입력하고, 클릭하여 실천 계획을 세울 수 있습니다.
            </p>
          </motion.div>
        )}

        {/* Mandalart Grid */}
        <MandalartGrid
          cells={cells}
          onContentChange={updateCellContent}
          onCellClick={handleCellClick}
        />

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-sm text-muted-foreground"
        >
          <p>💡 팁: 셀을 <span className="font-medium">더블클릭</span>하여 수정, <span className="font-medium">클릭</span>하여 실천 계획을 확인하세요</p>
        </motion.div>
      </main>

      {/* Cell Detail Drawer */}
      <CellDetailDrawer
        cell={selectedCell}
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        onUpdate={refreshCells}
      />
    </div>
  );
}
