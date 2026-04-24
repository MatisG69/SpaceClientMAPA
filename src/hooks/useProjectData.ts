import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PortalMessage, PortalUser, ProjectStep, ProjectSummary } from '../lib/types';

interface ProjectDataState {
  loading: boolean;
  error: string | null;
  portalUser: PortalUser | null;
  project: ProjectSummary | null;
  steps: ProjectStep[];
  messages: PortalMessage[];
}

/**
 * Charge en un appel les données du projet du client connecté :
 * - portal_users (pour récupérer project_id)
 * - projects (infos du projet)
 * - project_steps (timeline)
 * - portal_messages (conversation)
 *
 * RLS côté Supabase garantit qu'un client authentifié ne voit que SON projet.
 */
export function useProjectData(userId: string | null) {
  const [state, setState] = useState<ProjectDataState>({
    loading: true,
    error: null,
    portalUser: null,
    project: null,
    steps: [],
    messages: [],
  });

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data: portalUser, error: puErr } = await supabase
        .from('portal_users')
        .select('id, email, name, project_id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      if (puErr) throw puErr;
      if (!portalUser) {
        setState({
          loading: false,
          error: "Aucun projet n'est associé à votre compte. Contactez MAPA Développement.",
          portalUser: null,
          project: null,
          steps: [],
          messages: [],
        });
        return;
      }

      if (!portalUser.project_id) {
        setState({
          loading: false,
          error: "Aucun projet n'est assigné à votre compte pour l'instant.",
          portalUser: portalUser as PortalUser,
          project: null,
          steps: [],
          messages: [],
        });
        return;
      }

      const [{ data: project, error: pErr }, { data: steps, error: sErr }, { data: messages, error: mErr }] =
        await Promise.all([
          supabase
            .from('projects')
            .select('id, name, description, status, site_url, start_date, end_date, progress')
            .eq('id', portalUser.project_id)
            .maybeSingle(),
          supabase
            .from('project_steps')
            .select('*')
            .eq('project_id', portalUser.project_id)
            .order('order_index', { ascending: true }),
          supabase
            .from('portal_messages')
            .select('*')
            .eq('project_id', portalUser.project_id)
            .order('created_at', { ascending: true }),
        ]);
      if (pErr) throw pErr;
      if (sErr) throw sErr;
      if (mErr) throw mErr;

      setState({
        loading: false,
        error: null,
        portalUser: portalUser as PortalUser,
        project: (project ?? null) as ProjectSummary | null,
        steps: (steps ?? []) as ProjectStep[],
        messages: (messages ?? []) as PortalMessage[],
      });

      // Marque les messages de l'équipe comme lus côté client
      const unread = (messages ?? []).filter(
        (m: PortalMessage) => m.sender === 'team' && !m.read_by_client
      );
      if (unread.length > 0) {
        await supabase
          .from('portal_messages')
          .update({ read_by_client: true })
          .in(
            'id',
            unread.map((m) => m.id)
          );
      }
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'Erreur inconnue',
      }));
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!state.portalUser?.project_id) throw new Error('Projet indisponible');
      const { data, error } = await supabase
        .from('portal_messages')
        .insert({
          project_id: state.portalUser.project_id,
          sender: 'client',
          content: content.trim(),
          read_by_client: true,
        })
        .select('*')
        .single();
      if (error) throw error;
      setState((s) => ({ ...s, messages: [...s.messages, data as PortalMessage] }));
    },
    [state.portalUser?.project_id]
  );

  // Realtime sur les messages (pour voir les réponses de l'équipe sans refresh)
  useEffect(() => {
    if (!state.portalUser?.project_id) return;
    const channel = supabase
      .channel(`portal_messages_${state.portalUser.project_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'portal_messages',
          filter: `project_id=eq.${state.portalUser.project_id}`,
        },
        (payload) => {
          const msg = payload.new as PortalMessage;
          setState((s) => {
            if (s.messages.some((x) => x.id === msg.id)) return s;
            return { ...s, messages: [...s.messages, msg] };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'project_steps',
          filter: `project_id=eq.${state.portalUser.project_id}`,
        },
        (payload) => {
          const step = payload.new as ProjectStep;
          setState((s) => ({
            ...s,
            steps: s.steps.map((x) => (x.id === step.id ? step : x)),
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_steps',
          filter: `project_id=eq.${state.portalUser.project_id}`,
        },
        (payload) => {
          const step = payload.new as ProjectStep;
          setState((s) => ({
            ...s,
            steps: [...s.steps, step].sort((a, b) => a.order_index - b.order_index),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.portalUser?.project_id]);

  return { ...state, refresh: fetchAll, sendMessage };
}
