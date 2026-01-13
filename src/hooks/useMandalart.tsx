import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Mandalart, Cell, getCellLevel } from '@/types/mandalart';
import { toast } from 'sonner';

// Mapping: center 3x3 outer cells -> corresponding sub-center cells
// Center 3x3 positions (excluding 40 which is CENTER):
// 30, 31, 32 (top row)
// 39,     41 (middle row)
// 48, 49, 50 (bottom row)
// These map to sub-centers: 10, 13, 16, 37, 43, 64, 67, 70
const CENTER_TO_SUBCENTER_MAP: Record<number, number> = {
  30: 10, // top-left -> sub-grid 0 center
  31: 13, // top-center -> sub-grid 1 center
  32: 16, // top-right -> sub-grid 2 center
  39: 37, // middle-left -> sub-grid 3 center
  41: 43, // middle-right -> sub-grid 5 center
  48: 64, // bottom-left -> sub-grid 6 center
  49: 67, // bottom-center -> sub-grid 7 center
  50: 70, // bottom-right -> sub-grid 8 center
};

// Reverse mapping for syncing from sub-center to center area
const SUBCENTER_TO_CENTER_MAP: Record<number, number> = Object.fromEntries(
  Object.entries(CENTER_TO_SUBCENTER_MAP).map(([k, v]) => [v, Number(k)])
);

export function useMandalart() {
  const { user } = useAuth();
  const [mandalart, setMandalart] = useState<Mandalart | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch the user's first mandalart (or create one if none exists)
  const fetchOrCreateMandalart = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Try to fetch existing mandalart
      const { data: mandalarts, error: fetchError } = await supabase
        .from('mandalarts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (mandalarts && mandalarts.length > 0) {
        setMandalart(mandalarts[0] as Mandalart);
        await fetchCells(mandalarts[0].id);
      } else {
        // Create new mandalart with 81 cells
        await createMandalart();
      }
    } catch (error) {
      console.error('Error fetching mandalart:', error);
      toast.error('Failed to load your mandalart');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createMandalart = async () => {
    if (!user) return;

    try {
      // Create mandalart
      const { data: newMandalart, error: mandalartError } = await supabase
        .from('mandalarts')
        .insert({
          user_id: user.id,
          title: 'My Goals',
          theme_color: '#F59E0B',
        })
        .select()
        .single();

      if (mandalartError) throw mandalartError;

      // Create 81 cells
      const cellsToInsert = Array.from({ length: 81 }, (_, i) => ({
        mandalart_id: newMandalart.id,
        position: i,
        level: getCellLevel(i),
        content: '',
        progress: 0,
      }));

      const { error: cellsError } = await supabase
        .from('cells')
        .insert(cellsToInsert);

      if (cellsError) throw cellsError;

      setMandalart(newMandalart as Mandalart);
      await fetchCells(newMandalart.id);
      toast.success('Created your new Mandalart!');
    } catch (error) {
      console.error('Error creating mandalart:', error);
      toast.error('Failed to create mandalart');
    }
  };

  const fetchCells = async (mandalartId: string) => {
    try {
      const { data, error } = await supabase
        .from('cells')
        .select(`
          *,
          action_plans (*)
        `)
        .eq('mandalart_id', mandalartId)
        .order('position', { ascending: true });

      if (error) throw error;
      setCells((data || []) as Cell[]);
    } catch (error) {
      console.error('Error fetching cells:', error);
      toast.error('Failed to load cells');
    }
  };

  const updateCellContent = async (cellId: string, content: string) => {
    try {
      // Find the cell being updated
      const cellToUpdate = cells.find(c => c.id === cellId);
      if (!cellToUpdate) return;

      const position = cellToUpdate.position;
      
      // Check if this is a center 3x3 outer cell that needs to sync to sub-center
      const linkedSubCenterPosition = CENTER_TO_SUBCENTER_MAP[position];
      
      // Check if this is a sub-center that needs to sync to center 3x3
      const linkedCenterPosition = SUBCENTER_TO_CENTER_MAP[position];

      // Update the main cell
      const { error } = await supabase
        .from('cells')
        .update({ content })
        .eq('id', cellId);

      if (error) throw error;

      // Prepare updates array
      const updates: { id: string; content: string }[] = [{ id: cellId, content }];

      // If editing center 3x3 outer cell, sync to corresponding sub-center
      if (linkedSubCenterPosition !== undefined) {
        const subCenterCell = cells.find(c => c.position === linkedSubCenterPosition);
        if (subCenterCell) {
          const { error: syncError } = await supabase
            .from('cells')
            .update({ content })
            .eq('id', subCenterCell.id);
          
          if (!syncError) {
            updates.push({ id: subCenterCell.id, content });
          }
        }
      }

      // If editing a sub-center, sync to corresponding center 3x3 cell
      if (linkedCenterPosition !== undefined) {
        const centerCell = cells.find(c => c.position === linkedCenterPosition);
        if (centerCell) {
          const { error: syncError } = await supabase
            .from('cells')
            .update({ content })
            .eq('id', centerCell.id);
          
          if (!syncError) {
            updates.push({ id: centerCell.id, content });
          }
        }
      }

      // Update local state
      setCells(prev => prev.map(cell => {
        const update = updates.find(u => u.id === cell.id);
        return update ? { ...cell, content: update.content } : cell;
      }));
    } catch (error) {
      console.error('Error updating cell:', error);
      toast.error('Failed to save');
    }
  };

  const updateMandalartTitle = async (title: string) => {
    if (!mandalart) return;

    try {
      const { error } = await supabase
        .from('mandalarts')
        .update({ title })
        .eq('id', mandalart.id);

      if (error) throw error;
      setMandalart({ ...mandalart, title });
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title');
    }
  };

  useEffect(() => {
    fetchOrCreateMandalart();
  }, [fetchOrCreateMandalart]);

  return {
    mandalart,
    cells,
    loading,
    updateCellContent,
    updateMandalartTitle,
    refreshCells: () => mandalart && fetchCells(mandalart.id),
  };
}
