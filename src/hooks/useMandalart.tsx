import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Mandalart, Cell, getCellLevel } from '@/types/mandalart';
import { toast } from 'sonner';

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
      const { error } = await supabase
        .from('cells')
        .update({ content })
        .eq('id', cellId);

      if (error) throw error;

      setCells(prev => prev.map(cell => 
        cell.id === cellId ? { ...cell, content } : cell
      ));
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
