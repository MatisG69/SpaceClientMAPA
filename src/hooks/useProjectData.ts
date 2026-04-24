import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  CalendarEvent,
  ChecklistItem,
  Invoice,
  PortalMessage,
  PortalUser,
  ProjectStep,
  ProjectSummary,
  Quote,
} from '../lib/types';

interface ProjectDataState {
  loading: boolean;
  error: string | null;
  portalUser: PortalUser | null;
  project: ProjectSummary | null;
  steps: ProjectStep[];
  messages: PortalMessage[];
  quotes: Quote[];
  invoices: Invoice[];
  events: CalendarEvent[];
  checklist: ChecklistItem[];
}

/**
 * Charge en un seul appel toutes les données nécessaires pour afficher
 * l'avancement complet du projet au client connecté :
 *  - portal_users (résolution de son project_id)
 *  - projects (métadonnées)
 *  - project_steps (timeline)
 *  - portal_messages (conversation)
 *  - quotes (devis émis)
 *  - invoices (factures)
 *  - calendar_events (prochains rendez-vous)
 *  - project_checklist_items (micro-tâches)
 *
 * La sécurité est entièrement assurée par les RLS Supabase.
 */
export function useProjectData(userId: string | null) {
  const [state, setState] = useState<ProjectDataState>({
    loading: true,
    error: null,
    portalUser: null,
    project: null,
    steps: [],
    messages: [],
    quotes: [],
    invoices: [],
    events: [],
    checklist: [],
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
        setState((s) => ({
          ...s,
          loading: false,
          error: "Aucun projet n'est associé à votre compte. Contactez MAPA Développement.",
          portalUser: null,
          project: null,
        }));
        return;
      }

      if (!portalUser.project_id) {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Aucun projet n'est assigné à votre compte pour l'instant.",
          portalUser: portalUser as PortalUser,
          project: null,
        }));
        return;
      }

      const projectId = portalUser.project_id;
      const [
        { data: project, error: pErr },
        { data: steps, error: sErr },
        { data: messages, error: mErr },
        { data: quotes, error: qErr },
        { data: invoices, error: iErr },
        { data: events, error: eErr },
        { data: checklist, error: cErr },
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, description, status, type, site_url, start_date, end_date, progress, budget')
          .eq('id', projectId)
          .maybeSingle(),
        supabase
          .from('project_steps')
          .select('*')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true }),
        supabase
          .from('portal_messages')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
        supabase
          .from('quotes')
          .select('id, title, quote_number, amount, status, valid_until, deposit_requested, deposit_amount, signed_at, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('id, invoice_number, amount, status, due_date, paid_date, notes, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('calendar_events')
          .select('id, title, description, start_at, end_at, all_day, recurrence')
          .eq('project_id', projectId)
          .gte('start_at', new Date(Date.now() - 24 * 3600_000).toISOString())
          .order('start_at', { ascending: true })
          .limit(8),
        supabase
          .from('project_checklist_items')
          .select('id, label, done, position')
          .eq('project_id', projectId)
          .order('position', { ascending: true }),
      ]);

      if (pErr) throw pErr;
      if (sErr) throw sErr;
      if (mErr) throw mErr;
      // Les tables secondaires peuvent être vides sans RLS → on ignore seulement les erreurs non critiques
      // (si quotes/invoices/events/checklist ne sont pas accessibles, on laisse un tableau vide sans casser l'UI)

      setState({
        loading: false,
        error: null,
        portalUser: portalUser as PortalUser,
        project: (project ?? null) as ProjectSummary | null,
        steps: (steps ?? []) as ProjectStep[],
        messages: (messages ?? []) as PortalMessage[],
        quotes: (qErr ? [] : (quotes ?? [])) as Quote[],
        invoices: (iErr ? [] : (invoices ?? [])) as Invoice[],
        events: (eErr ? [] : (events ?? [])) as CalendarEvent[],
        checklist: (cErr ? [] : (checklist ?? [])) as ChecklistItem[],
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

  // Realtime sur les messages et les étapes (pour voir les mises à jour sans refresh)
  useEffect(() => {
    if (!state.portalUser?.project_id) return;
    const channel = supabase
      .channel(`portal_realtime_${state.portalUser.project_id}`)
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${state.portalUser.project_id}`,
        },
        (payload) => {
          const proj = payload.new as ProjectSummary;
          setState((s) => ({ ...s, project: proj }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.portalUser?.project_id]);

  return { ...state, refresh: fetchAll, sendMessage };
}
