import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProjectProduction } from '../lib/types';

/**
 * Lecture seule du module post-livraison côté client.
 * RLS garantit que le client ne voit que ses propres projets.
 */
export function useProjectProduction(projectId: string | null) {
  const [data, setData] = useState<ProjectProduction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: row, error: err } = await supabase
        .from('project_production')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (err) throw err;
      setData((row ?? null) as ProjectProduction | null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
