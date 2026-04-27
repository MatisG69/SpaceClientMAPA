import type { ProjectStatus, ProjectStepStatus } from '../lib/types';

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: 'En préparation',
  quote_sent: 'Devis envoyé',
  in_progress: 'En cours',
  review: 'En relecture',
  completed: 'Livré',
  on_hold: 'En pause',
};

export const STEP_STATUS_LABEL: Record<ProjectStepStatus, string> = {
  pending: 'À venir',
  in_progress: 'En cours',
  done: 'Terminée',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    planning: 'bg-ws-deep/60 text-ws-ink border-ws-line',
    quote_sent: 'bg-ws-accent/10 text-ws-accent-soft border-ws-accent/30',
    in_progress: 'bg-ws-accent/15 text-ws-accent border-ws-accent/40',
    review: 'bg-amber-500/10 text-amber-200 border-amber-500/30',
    completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    on_hold: 'bg-ws-deep/60 text-ws-mist border-ws-line',
  };
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.22em] border ${styles[status]}`}
    >
      {PROJECT_STATUS_LABEL[status]}
    </span>
  );
}

export function StepStatusBadge({ status }: { status: ProjectStepStatus }) {
  const styles: Record<ProjectStepStatus, string> = {
    pending: 'bg-ws-deep/50 text-ws-mist border-ws-line',
    in_progress: 'bg-ws-accent/15 text-ws-accent border-ws-accent/40',
    done: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.2em] border ${styles[status]}`}
    >
      {STEP_STATUS_LABEL[status]}
    </span>
  );
}
