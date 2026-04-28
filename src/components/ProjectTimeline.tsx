import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  ShieldCheck,
  PenTool,
  Loader2,
  Calendar,
} from 'lucide-react';
import type { ProjectStep } from '../lib/types';
import { StepStatusBadge } from './StatusBadge';
import { supabase } from '../lib/supabase';

interface ProjectTimelineProps {
  steps: ProjectStep[];
  defaultSignature?: string;
  onRefresh?: () => void | Promise<void>;
}

const PHASE_LABEL: Record<string, string> = {
  analyse: '01 — Analyse',
  conception: '02 — Conception',
  dev: '03 — Développement',
  ajustements: '04 — Ajustements',
  livraison: '05 — Livraison',
};

const PHASE_TONE: Record<string, string> = {
  analyse: 'bg-sky-500/10 border-sky-500/30 text-sky-300',
  conception: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
  dev: 'bg-ws-accent/12 border-ws-accent/35 text-ws-accent',
  ajustements: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  livraison: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300',
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function ProjectTimeline({
  steps,
  defaultSignature = '',
  onRefresh,
}: ProjectTimelineProps) {
  /* Group by phase (steps sans phase → "Étapes" générique) */
  const grouped = useMemo(() => {
    const phases: Record<string, ProjectStep[]> = {
      analyse: [],
      conception: [],
      dev: [],
      ajustements: [],
      livraison: [],
    };
    const ungrouped: ProjectStep[] = [];
    for (const s of steps) {
      if (s.phase && phases[s.phase]) phases[s.phase].push(s);
      else ungrouped.push(s);
    }
    return { phases, ungrouped };
  }, [steps]);

  const hasPhases = Object.values(grouped.phases).some((arr) => arr.length > 0);

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
    <div className="space-y-6">
      {hasPhases && (
        <PhaseStrip steps={steps} />
      )}

      {hasPhases &&
        Object.entries(grouped.phases).map(([phase, phaseSteps]) =>
          phaseSteps.length === 0 ? null : (
            <div key={phase} className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-mono uppercase tracking-[0.2em] ${PHASE_TONE[phase]}`}
                >
                  {PHASE_LABEL[phase]}
                </span>
                <span className="text-[10px] font-mono text-ws-mist">
                  {phaseSteps.filter((s) => s.status === 'done').length}/{phaseSteps.length} terminées
                </span>
              </div>
              <StepsList steps={phaseSteps} defaultSignature={defaultSignature} onRefresh={onRefresh} />
            </div>
          ),
        )}

      {grouped.ungrouped.length > 0 && (
        <div className="space-y-3">
          {hasPhases && (
            <span className="inline-flex items-center px-3 py-1 rounded-full border bg-ws-deep/40 border-ws-line text-[10px] font-mono uppercase tracking-[0.2em] text-ws-mist">
              Autres étapes
            </span>
          )}
          <StepsList
            steps={grouped.ungrouped}
            defaultSignature={defaultSignature}
            onRefresh={onRefresh}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────── */

function PhaseStrip({ steps }: { steps: ProjectStep[] }) {
  const phases: Array<keyof typeof PHASE_LABEL> = [
    'analyse',
    'conception',
    'dev',
    'ajustements',
    'livraison',
  ];

  const stats = phases.map((p) => {
    const phaseSteps = steps.filter((s) => s.phase === p);
    const done = phaseSteps.filter((s) => s.status === 'done').length;
    const inProgress = phaseSteps.some((s) => s.status === 'in_progress');
    const pct = phaseSteps.length > 0 ? Math.round((done / phaseSteps.length) * 100) : 0;
    return { phase: p, total: phaseSteps.length, done, pct, inProgress };
  });

  return (
    <div className="rounded-2xl border border-ws-line bg-ws-panel/40 px-4 py-3">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {stats.map((s, i) => {
          if (s.total === 0) return null;
          const isActive = s.inProgress;
          const isDone = s.pct === 100;
          return (
            <div key={s.phase} className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300'
                    : isActive
                      ? 'bg-ws-accent/15 border-ws-accent/45 text-ws-accent'
                      : 'bg-ws-deep/40 border-ws-line text-ws-mist'
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-[0.18em]">
                  {PHASE_LABEL[s.phase].split(' — ')[1]}
                </span>
                <span className="text-[10px] font-mono tabular-nums opacity-80">
                  {s.done}/{s.total}
                </span>
              </div>
              {i < stats.length - 1 && stats[i + 1].total > 0 && (
                <span className="text-ws-mist/40 text-xs">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */

function StepsList({
  steps,
  defaultSignature,
  onRefresh,
}: {
  steps: ProjectStep[];
  defaultSignature: string;
  onRefresh?: () => void | Promise<void>;
}) {
  return (
    <ol className="relative">
      <div
        className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-ws-accent/50 via-ws-line to-ws-line/30"
        aria-hidden
      />
      {steps.map((step, idx) => (
        <StepCard
          key={step.id}
          step={step}
          index={idx}
          defaultSignature={defaultSignature}
          onRefresh={onRefresh}
        />
      ))}
    </ol>
  );
}

/* ─────────────────────────────────────────────── */

function StepCard({
  step,
  index,
  defaultSignature,
  onRefresh,
}: {
  step: ProjectStep;
  index: number;
  defaultSignature: string;
  onRefresh?: () => void | Promise<void>;
}) {
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [signature, setSignature] = useState(defaultSignature);
  const [showValidationForm, setShowValidationForm] = useState(false);

  const Icon =
    step.status === 'done' ? CheckCircle2 : step.status === 'in_progress' ? Clock : Circle;
  const iconColor =
    step.status === 'done'
      ? 'text-emerald-400'
      : step.status === 'in_progress'
        ? 'text-ws-accent'
        : 'text-ws-mist/50';
  const isActive = step.status === 'in_progress';

  const needsValidation = step.requires_validation && !step.validated_at;
  const isValidated = !!step.validated_at;

  // Detect retard sur le planned_end
  const today = new Date(new Date().toDateString());
  const overdue =
    step.planned_end &&
    step.status !== 'done' &&
    new Date(step.planned_end) < today;

  const handleValidate = async () => {
    if (!signature.trim()) {
      setSignError('Tapez votre nom complet pour valider.');
      return;
    }
    setSignError(null);
    setSigning(true);
    try {
      let ip: string | null = null;
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        if (res.ok) {
          const json = (await res.json()) as { ip?: string };
          ip = json.ip ?? null;
        }
      } catch {
        /* ip optional */
      }

      const { error } = await supabase
        .from('project_steps')
        .update({
          validated_at: new Date().toISOString(),
          validated_signature: signature.trim(),
          validated_by_ip: ip,
        })
        .eq('id', step.id);
      if (error) throw error;
      await onRefresh?.();
      setShowValidationForm(false);
    } catch (e) {
      setSignError((e as Error).message);
    } finally {
      setSigning(false);
    }
  };

  return (
    <li className="relative pl-12 pb-6 last:pb-0">
      <div
        className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center bg-ws-deep border-2 ${
          isActive
            ? 'border-ws-accent shadow-glow-sm'
            : isValidated
              ? 'border-emerald-500/50'
              : 'border-ws-line'
        }`}
      >
        <Icon size={18} className={`${iconColor} ${isActive ? 'animate-pulse' : ''}`} strokeWidth={1.8} />
      </div>

      <div
        className={`rounded-2xl border p-4 transition-all ${
          isActive
            ? 'border-ws-accent/40 bg-ws-accent/[0.04] shadow-glow'
            : isValidated
              ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
              : 'border-ws-line bg-ws-panel/60'
        }`}
      >
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="text-[10px] font-mono text-ws-mist tracking-[0.2em]">
            ÉTAPE {String(index + 1).padStart(2, '0')}
          </span>
          <StepStatusBadge status={step.status} />
          {isValidated && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border bg-emerald-500/12 border-emerald-500/35 text-emerald-300 text-[9px] font-mono uppercase tracking-[0.15em]">
              <ShieldCheck size={9} />
              Validé client
            </span>
          )}
          {overdue && !isValidated && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border bg-red-500/12 border-red-500/35 text-red-300 text-[9px] font-mono uppercase tracking-[0.15em]">
              En retard
            </span>
          )}
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

        <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono text-ws-mist">
          {(step.planned_start || step.planned_end) && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {step.planned_start && step.planned_end
                ? `${formatDate(step.planned_start)} → ${formatDate(step.planned_end)}`
                : step.planned_end
                  ? `Prévu pour le ${formatDate(step.planned_end)}`
                  : `Démarrage prévu ${formatDate(step.planned_start)}`}
            </span>
          )}
          {step.status === 'in_progress' && step.started_at && (
            <span>· Démarrée le {formatDate(step.started_at)}</span>
          )}
          {step.status === 'done' && step.completed_at && (
            <span>· Terminée le {formatDate(step.completed_at)}</span>
          )}
        </div>

        {step.deliverable_url && (
          <a
            href={step.deliverable_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-2 rounded-lg border border-ws-accent/35 bg-ws-accent/10 text-ws-accent hover:bg-ws-accent/15 transition-colors text-xs font-mono"
          >
            <ExternalLink size={12} />
            Consulter le livrable
          </a>
        )}

        {/* Validation client */}
        {needsValidation && (
          <div className="mt-4 pt-4 border-t border-ws-accent/20">
            {!showValidationForm ? (
              <button
                type="button"
                onClick={() => setShowValidationForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ws-accent text-ws-void text-xs font-semibold hover:brightness-110 transition-all"
              >
                <PenTool size={13} />
                Je valide cette étape
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-ws-paper font-medium">
                  Validez cette étape en tapant votre nom complet
                </p>
                <div className="flex items-end gap-2 flex-wrap">
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Votre nom complet"
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-ws-deep border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent"
                    disabled={signing}
                  />
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={signing || !signature.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ws-accent text-ws-void text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {signing ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                    {signing ? 'Validation...' : 'Confirmer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowValidationForm(false);
                      setSignError(null);
                    }}
                    className="text-[10px] font-mono uppercase tracking-[0.15em] text-ws-mist hover:text-ws-paper px-2"
                  >
                    Annuler
                  </button>
                </div>
                {signError && (
                  <p className="text-xs text-red-300 font-mono" role="alert">
                    {signError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {isValidated && step.validated_signature && (
          <div className="mt-3 pt-3 border-t border-emerald-500/20 text-[10px] font-mono text-ws-cream-soft flex items-center gap-2 flex-wrap">
            <ShieldCheck size={11} className="text-emerald-400" />
            Validé par <strong className="text-ws-paper">{step.validated_signature}</strong> le{' '}
            {formatDate(step.validated_at)}
            {step.validated_by_ip && <span className="opacity-60">· IP {step.validated_by_ip}</span>}
          </div>
        )}
      </div>
    </li>
  );
}
