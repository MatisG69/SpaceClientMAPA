import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProjectBrief } from '../lib/types';

/**
 * Récupération du brief d'un projet pour le client connecté.
 * RLS Supabase scope automatiquement aux projets du client (cf. policy
 * `auth_read_own_brief`).
 *
 * `validate()` enregistre la validation avec timestamp + IP + signature.
 * IP récupérée via `api.ipify.org` (service public, anonyme, gratuit).
 */
export function useProjectBrief(projectId: string | null) {
  const [brief, setBrief] = useState<ProjectBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = useCallback(async () => {
    if (!projectId) {
      setBrief(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('project_briefs')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (err) throw err;
      setBrief((data ?? null) as ProjectBrief | null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchBrief();
  }, [fetchBrief]);

  /** Valide le périmètre — signature texte + timestamp + IP. */
  const validate = useCallback(
    async (signature: string): Promise<ProjectBrief | null> => {
      if (!brief) return null;
      const trimmed = signature.trim();
      if (!trimmed) throw new Error('Signature requise');

      // Récupère l'IP publique du client (best-effort, échec silencieux)
      let ip: string | null = null;
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
          const json = (await res.json()) as { ip?: string };
          ip = json.ip ?? null;
        }
      } catch {
        /* ip reste null — la validation reste valide sans */
      }

      const { data, error: err } = await supabase
        .from('project_briefs')
        .update({
          validated_at: new Date().toISOString(),
          validated_by_ip: ip,
          validated_signature: trimmed,
        })
        .eq('id', brief.id)
        .select('*')
        .single();
      if (err) throw err;
      const updated = data as ProjectBrief;
      setBrief(updated);
      return updated;
    },
    [brief],
  );

  return { brief, loading, error, refetch: fetchBrief, validate };
}
