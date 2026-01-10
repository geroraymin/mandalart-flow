export type CellLevel = 'CENTER' | 'SUB_CENTER' | 'LEAF';
export type ActionType = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type ActionStatus = 'DONE' | 'SKIP';

export interface ActionPlan {
  id: string;
  cell_id: string;
  type: ActionType;
  target_count: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionLog {
  id: string;
  action_plan_id: string;
  log_date: string;
  status: ActionStatus;
  created_at: string;
}

export interface Cell {
  id: string;
  mandalart_id: string;
  position: number;
  level: CellLevel;
  content: string;
  progress: number;
  created_at: string;
  updated_at: string;
  action_plans?: ActionPlan[];
}

export interface Mandalart {
  id: string;
  user_id: string;
  title: string;
  start_date: string | null;
  theme_color: string;
  created_at: string;
  updated_at: string;
  cells?: Cell[];
}

// Helper to determine cell level based on position
export function getCellLevel(position: number): CellLevel {
  // Position 40 is the center of the 9x9 grid
  if (position === 40) return 'CENTER';
  
  // Sub-centers are at positions: 10, 13, 16, 37, 43, 64, 67, 70
  // These are the centers of each 3x3 sub-grid
  const subCenters = [10, 13, 16, 37, 43, 64, 67, 70];
  if (subCenters.includes(position)) return 'SUB_CENTER';
  
  return 'LEAF';
}

// Get the grid row and column for a position
export function getGridPosition(position: number): { row: number; col: number } {
  return {
    row: Math.floor(position / 9),
    col: position % 9,
  };
}

// Get which 3x3 sub-grid a position belongs to
export function getSubGridIndex(position: number): number {
  const { row, col } = getGridPosition(position);
  const subRow = Math.floor(row / 3);
  const subCol = Math.floor(col / 3);
  return subRow * 3 + subCol;
}

// Get the sub-center position for a given sub-grid
export function getSubCenterPosition(subGridIndex: number): number {
  const subGridCenters = [10, 13, 16, 37, 40, 43, 64, 67, 70];
  return subGridCenters[subGridIndex];
}
