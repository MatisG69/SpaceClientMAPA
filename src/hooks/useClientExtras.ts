import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  NdaAgreement,
  ProjectSuggestion,
  SuggestionKind,
  Testimonial,
} from '../lib/types';

async function fetchPublicIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) return null;
    const json = (await res.json()) as { ip?: string };
    return json.ip ?? null;
  } catch {
    return null;
  }
}

/**
 * Hook portail — Sprint 7 :
 *   · témoignages (lecture des miens + création)
 *   · NDA (lecture + signature)
 *   · suggestions (lecture + création)
 *
 * RLS scope par client_id via portal_users.
 */
export function useClientExtras(projectId: string | null, clientId: string | null) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [ndas, setNdas] = useState<NdaAgreement[]>([]);
  const [suggestions, setSuggestions] = useState<ProjectSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) {
      setTestimonials([]);
      setNdas([]);
      setSuggestions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [tRes, nRes, sRes] = await Promise.all([
        supabase
          .from('testimonials')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('nda_agreements')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('project_suggestions')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
      ]);
      if (tRes.error) throw tRes.error;
      if (nRes.error) throw nRes.error;
      if (sRes.error) throw sRes.error;
      setTestimonials((tRes.data ?? []) as Testimonial[]);
      setNdas((nRes.data ?? []) as NdaAgreement[]);
      setSuggestions((sRes.data ?? []) as ProjectSuggestion[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  /* Témoignages */
  const submitTestimonial = useCallback(
    async (input: {
      rating: number;
      content: string;
      authorSignature: string;
      authorRole?: string | null;
      allowPublic: boolean;
      allowLogo: boolean;
    }): Promise<Testimonial> => {
      if (!projectId || !clientId) throw new Error('Projet introuvable');
      if (input.rating < 1 || input.rating > 5) throw new Error('Note entre 1 et 5');
      if (!input.content.trim()) throw new Error('Contenu requis');
      if (!input.authorSignature.trim()) throw new Error('Signature requise');
      const ip = await fetchPublicIp();
      const { data, error: err } = await supabase
        .from('testimonials')
        .insert({
          project_id: projectId,
          client_id: clientId,
          rating: input.rating,
          content: input.content.trim(),
          author_signature: input.authorSignature.trim(),
          author_role: input.authorRole?.trim() || null,
          allow_public: input.allowPublic,
          allow_logo: input.allowLogo,
          signed_by_ip: ip,
        })
        .select('*')
        .single();
      if (err) throw err;
      const created = data as Testimonial;
      setTestimonials((prev) => [created, ...prev]);
      return created;
    },
    [projectId, clientId],
  );

  /* NDA */
  const signNda = useCallback(async (id: string, signature: string): Promise<NdaAgreement> => {
    const trimmed = signature.trim();
    if (!trimmed) throw new Error('Signature requise');
    const ip = await fetchPublicIp();
    const { data, error: err } = await supabase
      .from('nda_agreements')
      .update({
        signed_at: new Date().toISOString(),
        signed_by_signature: trimmed,
        signed_by_ip: ip,
        status: 'signed',
      })
      .eq('id', id)
      .select('*')
      .single();
    if (err) throw err;
    const updated = data as NdaAgreement;
    setNdas((prev) => prev.map((n) => (n.id === id ? updated : n)));
    return updated;
  }, []);

  /* Suggestions */
  const submitSuggestion = useCallback(
    async (input: {
      title: string;
      description?: string | null;
      kind: SuggestionKind;
      signature?: string | null;
    }): Promise<ProjectSuggestion> => {
      if (!projectId || !clientId) throw new Error('Projet introuvable');
      if (!input.title.trim()) throw new Error('Titre requis');
      const { data, error: err } = await supabase
        .from('project_suggestions')
        .insert({
          project_id: projectId,
          client_id: clientId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          kind: input.kind,
          submitted_by_signature: input.signature?.trim() || null,
        })
        .select('*')
        .single();
      if (err) throw err;
      const created = data as ProjectSuggestion;
      setSuggestions((prev) => [created, ...prev]);
      return created;
    },
    [projectId, clientId],
  );

  return {
    testimonials,
    ndas,
    suggestions,
    loading,
    error,
    refetch,
    submitTestimonial,
    signNda,
    submitSuggestion,
  };
}
