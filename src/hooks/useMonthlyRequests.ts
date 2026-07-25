import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { MonthlyRequest } from '../lib/types';

/**
 * Demandes mensuelles côté client. Lecture scopée par RLS (client_id dérivé
 * du portal_user). Le décompte mensuel est calculé côté composant à partir
 * de la liste — le « reset » est automatique au changement de mois.
 */
export function useMonthlyRequests(projectId: string | null, clientId: string | null) {
  const [items, setItems] = useState<MonthlyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('monthly_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setItems((data ?? []) as MonthlyRequest[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const submitRequest = useCallback(
    async (input: { content: string; signature: string }): Promise<MonthlyRequest> => {
      if (!projectId || !clientId) throw new Error('Projet introuvable');
      const content = input.content.trim();
      if (!content) throw new Error('Décrivez votre demande.');
      const { data, error: err } = await supabase
        .from('monthly_requests')
        .insert({
          project_id: projectId,
          client_id: clientId,
          content,
          submitted_by_signature: input.signature.trim() || null,
        })
        .select('*')
        .single();
      if (err) throw err;
      const created = data as MonthlyRequest;
      setItems((prev) => [created, ...prev]);
      return created;
    },
    [projectId, clientId],
  );

  return { items, loading, error, refetch, submitRequest };
}
