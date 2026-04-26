import { useCallback, useEffect, useMemo, useState } from 'react';
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
  /** Tous les projets du client lié à l'utilisateur portail. */
  projects: ProjectSummary[];
  /** Identifiant du projet actuellement consulté (premier projet par défaut). */
  selectedProjectId: string | null;
  steps: ProjectStep[];
  messages: PortalMessage[];
  /** Devis du client (tous projets confondus). */
  quotes: Quote[];
  /** Factures du client (tous projets confondus). */
  invoices: Invoice[];
  /** Événements à venir du client (tous projets confondus). */
  events: CalendarEvent[];
  /** Checklist du projet actuellement consulté. */
  checklist: ChecklistItem[];
}

const PROJECT_STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  review: 1,
  quote_sent: 2,
  planning: 3,
  on_hold: 4,
  completed: 5,
};

/**
 * Charge toutes les données nécessaires à l'espace client multi-projets.
 *  - portal_users → résolution du client_id
 *  - projects     → tous les projets du client
 *  - project_steps / portal_messages / project_checklist_items → projet sélectionné
 *  - quotes / invoices / calendar_events → tous les projets du client (vue agrégée)
 *
 * Sécurité : RLS Supabase scope par client_id (cf. migration `portal_users_client_scope`).
 */
export function useProjectData(userId: string | null) {
  const [state, setState] = useState<ProjectDataState>({
    loading: true,
    error: null,
    portalUser: null,
    projects: [],
    selectedProjectId: null,
    steps: [],
    messages: [],
    quotes: [],
    invoices: [],
    events: [],
    checklist: [],
  });

  /** Tri pipeline : projets actifs d'abord, puis par date desc */
  const sortProjects = (list: ProjectSummary[]) =>
    list.slice().sort((a, b) => {
      const oa = PROJECT_STATUS_ORDER[a.status] ?? 9;
      const ob = PROJECT_STATUS_ORDER[b.status] ?? 9;
      if (oa !== ob) return oa - ob;
      return (b.start_date ?? '').localeCompare(a.start_date ?? '');
    });

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data: portalUser, error: puErr } = await supabase
        .from('portal_users')
        .select('id, email, name, client_id, project_id')
        .eq('auth_user_id', userId)
        .maybeSingle();
      if (puErr) throw puErr;
      if (!portalUser) {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Votre compte n'est pas associé à un client. Contactez MAPA Développement.",
          portalUser: null,
          projects: [],
          selectedProjectId: null,
        }));
        return;
      }

      const clientId = portalUser.client_id as string | null;
      if (!clientId) {
        setState((s) => ({
          ...s,
          loading: false,
          error: "Aucun client n'est rattaché à votre compte pour l'instant.",
          portalUser: portalUser as PortalUser,
          projects: [],
          selectedProjectId: null,
        }));
        return;
      }

      // 1. Récupérer tous les projets du client + données globales (devis/factures/événements client)
      const [
        { data: projectsData, error: projsErr },
        { data: quotes, error: qErr },
        { data: invoices, error: iErr },
        { data: events, error: eErr },
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, description, status, type, site_url, start_date, end_date, progress, budget, created_at')
          .eq('client_id', clientId),
        supabase
          .from('quotes')
          .select('id, project_id, title, quote_number, amount, status, valid_until, deposit_requested, deposit_amount, signed_at, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('id, project_id, invoice_number, amount, status, due_date, paid_date, notes, created_at')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false }),
        supabase
          .from('calendar_events')
          .select('id, title, description, start_at, end_at, all_day, recurrence, project_id, client_id')
          .eq('client_id', clientId)
          .gte('start_at', new Date(Date.now() - 24 * 3600_000).toISOString())
          .order('start_at', { ascending: true })
          .limit(12),
      ]);

      if (projsErr) throw projsErr;

      const projects = sortProjects((projectsData ?? []) as ProjectSummary[]);
      if (projects.length === 0) {
        setState({
          loading: false,
          error: null,
          portalUser: portalUser as PortalUser,
          projects: [],
          selectedProjectId: null,
          steps: [],
          messages: [],
          quotes: (qErr ? [] : (quotes ?? [])) as Quote[],
          invoices: (iErr ? [] : (invoices ?? [])) as Invoice[],
          events: (eErr ? [] : (events ?? [])) as CalendarEvent[],
          checklist: [],
        });
        return;
      }

      const selectedProjectId = projects[0].id;

      // 2. Charger les données du projet sélectionné
      const [
        { data: steps, error: sErr },
        { data: messages, error: mErr },
        { data: checklist, error: cErr },
      ] = await Promise.all([
        supabase
          .from('project_steps')
          .select('*')
          .eq('project_id', selectedProjectId)
          .order('order_index', { ascending: true }),
        supabase
          .from('portal_messages')
          .select('*')
          .eq('project_id', selectedProjectId)
          .order('created_at', { ascending: true }),
        supabase
          .from('project_checklist_items')
          .select('id, label, done, position')
          .eq('project_id', selectedProjectId)
          .order('position', { ascending: true }),
      ]);

      if (sErr) throw sErr;
      if (mErr) throw mErr;

      setState({
        loading: false,
        error: null,
        portalUser: portalUser as PortalUser,
        projects,
        selectedProjectId,
        steps: (steps ?? []) as ProjectStep[],
        messages: (messages ?? []) as PortalMessage[],
        quotes: (qErr ? [] : (quotes ?? [])) as Quote[],
        invoices: (iErr ? [] : (invoices ?? [])) as Invoice[],
        events: (eErr ? [] : (events ?? [])) as CalendarEvent[],
        checklist: (cErr ? [] : (checklist ?? [])) as ChecklistItem[],
      });

      // Marque les messages de l'équipe comme lus
      const unread = ((messages ?? []) as PortalMessage[]).filter(
        (m) => m.sender === 'team' && !m.read_by_client
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

  /** Change le projet consulté et recharge ses données spécifiques (steps, messages, checklist). */
  const selectProject = useCallback(async (projectId: string) => {
    if (!projectId) return;
    setState((s) => ({ ...s, selectedProjectId: projectId }));
    try {
      const [
        { data: steps },
        { data: messages },
        { data: checklist },
      ] = await Promise.all([
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
          .from('project_checklist_items')
          .select('id, label, done, position')
          .eq('project_id', projectId)
          .order('position', { ascending: true }),
      ]);
      setState((s) => ({
        ...s,
        steps: (steps ?? []) as ProjectStep[],
        messages: (messages ?? []) as PortalMessage[],
        checklist: (checklist ?? []) as ChecklistItem[],
      }));
      const unread = ((messages ?? []) as PortalMessage[]).filter(
        (m) => m.sender === 'team' && !m.read_by_client
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
    } catch {
      /* erreur réseau silencieuse — on garde l'ancien état */
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const projectId = state.selectedProjectId;
      if (!projectId) throw new Error('Aucun projet sélectionné');
      const { data, error } = await supabase
        .from('portal_messages')
        .insert({
          project_id: projectId,
          sender: 'client',
          content: content.trim(),
          read_by_client: true,
        })
        .select('*')
        .single();
      if (error) throw error;
      setState((s) => ({ ...s, messages: [...s.messages, data as PortalMessage] }));
    },
    [state.selectedProjectId]
  );

  // Realtime : abonnement par projet sélectionné (messages + steps)
  useEffect(() => {
    const projectId = state.selectedProjectId;
    if (!projectId) return;
    const channel = supabase
      .channel(`portal_realtime_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'portal_messages',
          filter: `project_id=eq.${projectId}`,
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
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const step = payload.new as ProjectStep;
          setState((s) => ({
            ...s,
            steps: s.steps.map((x) => (x.id === step.id ? step : x)),
          }));
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [state.selectedProjectId]);

  const selectedProject = useMemo(
    () => state.projects.find((p) => p.id === state.selectedProjectId) ?? null,
    [state.projects, state.selectedProjectId]
  );

  return {
    ...state,
    selectedProject,
    selectProject,
    sendMessage,
    refetch: fetchAll,
  };
}
