import { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Figma,
  ShieldCheck,
  PenTool,
} from 'lucide-react';
import { useProjectBrief } from '../hooks/useProjectBrief';

interface ProjectBriefViewerProps {
  projectId: string;
  defaultSignature?: string;
}

export function ProjectBriefViewer({ projectId, defaultSignature = '' }: ProjectBriefViewerProps) {
  const { brief, loading, error, validate } = useProjectBrief(projectId);
  const [signature, setSignature] = useState(defaultSignature);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  if (loading && !brief) {
    return (
      <section className="rounded-3xl border border-ws-line bg-ws-panel/60 px-5 py-8 text-center text-ws-mist font-mono text-sm">
        <Loader2 size={16} className="inline mr-2 animate-spin" />
        Chargement du brief…
      </section>
    );
  }

  if (error) {
    return (
      <section
        className="rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300 font-mono"
        role="alert"
      >
        {error}
      </section>
    );
  }

  if (!brief || !hasContent(brief)) {
    return (
      <section className="rounded-3xl border border-ws-line bg-ws-panel/40 px-5 py-8 text-center">
        <FileText size={22} className="mx-auto mb-3 text-ws-mist/60" />
        <p className="text-sm text-ws-paper font-medium mb-1">Brief en cours de rédaction</p>
        <p className="text-xs text-ws-mist max-w-md mx-auto leading-relaxed">
          Le brief détaillé du projet apparaîtra ici dès qu'il sera prêt. Vous pourrez le
          consulter et valider numériquement le périmètre.
        </p>
      </section>
    );
  }

  const isValidated = !!brief.validated_at;

  const handleValidate = async () => {
    if (!signature.trim()) {
      setSignError('Veuillez taper votre nom complet pour valider.');
      return;
    }
    setSignError(null);
    setSigning(true);
    try {
      await validate(signature);
    } catch (e) {
      setSignError((e as Error).message);
    } finally {
      setSigning(false);
    }
  };

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">
            Brief &amp; spécifications
          </h3>
        </div>
        {isValidated ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.18em] bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
            <CheckCircle2 size={11} />
            Validé le {new Date(brief.validated_at!).toLocaleDateString('fr-FR')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.18em] bg-ws-accent/15 border border-ws-accent/40 text-ws-accent">
            <PenTool size={11} />
            Validation requise
          </span>
        )}
      </header>

      <div className="px-5 py-5 space-y-5">
        {brief.objectives && (
          <Section title="Objectifs du projet" content={brief.objectives} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brief.scope_in && (
            <Section
              title="Inclus dans la prestation"
              content={brief.scope_in}
              tone="success"
              asList
            />
          )}
          {brief.scope_out && (
            <Section
              title="Hors périmètre"
              content={brief.scope_out}
              tone="warning"
              asList
            />
          )}
        </div>

        {brief.deliverables && (
          <Section title="Livrables attendus" content={brief.deliverables} asList />
        )}

        {brief.constraints && (
          <Section title="Contraintes" content={brief.constraints} />
        )}

        {brief.figma_url && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-ws-mist mb-2 flex items-center gap-2">
              <Figma size={10} />
              Maquettes
            </p>
            <a
              href={brief.figma_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-ws-accent/35 bg-ws-accent/10 text-ws-accent hover:bg-ws-accent/15 transition-colors text-sm font-mono"
            >
              <Figma size={13} />
              Ouvrir les maquettes Figma →
            </a>
          </div>
        )}

        {brief.notes && (
          <Section title="Notes additionnelles" content={brief.notes} />
        )}
      </div>

      {/* Bloc validation */}
      <div className="px-5 py-5 border-t border-ws-line bg-ws-deep/20">
        {isValidated ? (
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-ws-cream-soft font-mono leading-relaxed flex-1">
              <p className="text-emerald-200 font-medium mb-1">
                Périmètre validé par {brief.validated_signature}
              </p>
              <p className="opacity-80">
                {new Date(brief.validated_at!).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {brief.validated_by_ip && (
                  <span className="opacity-60"> · IP {brief.validated_by_ip}</span>
                )}
              </p>
              <p className="opacity-70 mt-1.5 text-[10px]">
                Cette signature numérique vaut accord sur le périmètre détaillé ci-dessus.
                En cas de modification du brief par le prestataire, une nouvelle validation
                vous sera demandée.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-ws-paper font-medium flex items-center gap-2">
              <PenTool size={14} className="text-ws-accent" />
              Validez le périmètre du projet
            </p>
            <p className="text-xs text-ws-mist leading-relaxed">
              En validant ce brief, vous confirmez votre accord sur le périmètre détaillé
              ci-dessus. Cette validation est horodatée et constitue une preuve écrite du
              cadrage initial.
            </p>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1">
                  Tapez votre nom complet pour signer
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="ex : Linda Denfer Kadiri"
                  className="w-full px-3 py-2 rounded-lg bg-ws-deep border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent"
                  disabled={signing}
                />
              </div>
              <button
                type="button"
                onClick={handleValidate}
                disabled={signing || !signature.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ws-accent text-ws-void text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                {signing ? 'Validation…' : 'Je valide le périmètre'}
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
    </section>
  );
}

/* ─────────────────────────────────────────────── */

function hasContent(brief: {
  objectives: string | null;
  scope_in: string | null;
  scope_out: string | null;
  constraints: string | null;
  deliverables: string | null;
  figma_url: string | null;
  notes: string | null;
}): boolean {
  return !!(
    brief.objectives ||
    brief.scope_in ||
    brief.scope_out ||
    brief.constraints ||
    brief.deliverables ||
    brief.figma_url ||
    brief.notes
  );
}

interface SectionProps {
  title: string;
  content: string;
  tone?: 'success' | 'warning';
  asList?: boolean;
}

function Section({ title, content, tone, asList = false }: SectionProps) {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•‣◦⁃*\-—–·]+/, '').trim())
    .filter((l) => l.length > 0);

  const titleColor =
    tone === 'success' ? 'text-emerald-300' : tone === 'warning' ? 'text-amber-300' : 'text-ws-mist';
  const titleIcon =
    tone === 'success' ? (
      <CheckCircle2 size={10} />
    ) : tone === 'warning' ? (
      <AlertTriangle size={10} />
    ) : null;

  return (
    <div>
      <p
        className={`text-[10px] font-mono uppercase tracking-[0.22em] mb-2 flex items-center gap-2 ${titleColor}`}
      >
        {titleIcon}
        {title}
      </p>
      {asList ? (
        <ul className="space-y-1.5">
          {lines.map((l, i) => (
            <li key={i} className="text-sm text-ws-paper leading-relaxed flex items-start gap-2">
              <span
                className={`flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${
                  tone === 'success' ? 'bg-emerald-400' : tone === 'warning' ? 'bg-amber-400' : 'bg-ws-accent'
                }`}
              />
              <span>{l}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ws-paper leading-relaxed whitespace-pre-wrap">{content}</p>
      )}
    </div>
  );
}
