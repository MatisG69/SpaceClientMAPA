import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { ProjectStep } from '../lib/types';
import { StepStatusBadge } from './StatusBadge';

interface ProjectTimelineProps {
  steps: ProjectStep[];
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function ProjectTimeline({ steps }: ProjectTimelineProps) {
  if (steps.length === 0) {
    return (
      <div className="rounded-2xl border border-ws-line bg-ws-panel/60 p-8 text-center">
        <p className="text-sm text-ws-mist">
          Les étapes de votre projet seront publiées ici dès que MAPA Développement démarre le
          travail.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative">
      {/* Ligne verticale */}
      <div
        className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-ws-accent/50 via-ws-line to-ws-line/30"
        aria-hidden
      />

      {steps.map((step, idx) => {
        const Icon =
          step.status === 'done' ? CheckCircle2 : step.status === 'in_progress' ? Clock : Circle;
        const iconColor =
          step.status === 'done'
            ? 'text-emerald-400'
            : step.status === 'in_progress'
            ? 'text-ws-accent'
            : 'text-ws-mist/50';
        const isActive = step.status === 'in_progress';

        return (
          <li key={step.id} className="relative pl-12 pb-8 last:pb-0">
            {/* Bullet */}
            <div
              className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center bg-ws-deep border-2 ${
                isActive ? 'border-ws-accent shadow-glow-sm' : 'border-ws-line'
              }`}
            >
              <Icon
                size={18}
                className={`${iconColor} ${isActive ? 'animate-pulse' : ''}`}
                strokeWidth={1.8}
              />
            </div>

            <div
              className={`rounded-2xl border p-5 transition-all ${
                isActive
                  ? 'border-ws-accent/40 bg-ws-accent/[0.04] shadow-glow'
                  : 'border-ws-line bg-ws-panel/60'
              }`}
            >
              <div className="flex items-center flex-wrap gap-3 mb-2">
                <span className="text-[10px] font-mono text-ws-mist tracking-[0.2em]">
                  ÉTAPE {String(idx + 1).padStart(2, '0')}
                </span>
                <StepStatusBadge status={step.status} />
              </div>
              <h3
                className={`font-display text-lg font-semibold leading-tight ${
                  step.status === 'done' ? 'text-ws-paper/90' : 'text-ws-paper'
                }`}
              >
                {step.title}
              </h3>
              {step.description && (
                <p className="text-sm text-ws-ink mt-2 leading-relaxed whitespace-pre-wrap">
                  {step.description}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-[11px] font-mono text-ws-mist">
                {step.status === 'in_progress' && step.started_at && (
                  <span>Démarrée le {formatDate(step.started_at)}</span>
                )}
                {step.status === 'done' && step.completed_at && (
                  <span>Terminée le {formatDate(step.completed_at)}</span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
