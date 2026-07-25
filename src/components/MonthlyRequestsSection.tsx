import { useMemo, useState } from 'react';
import { Inbox, Plus, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { MonthlyRequest, MonthlyRequestStatus, ProjectSummary } from '../lib/types';
import { useMonthlyRequests } from '../hooks/useMonthlyRequests';
import { formatDateTime, formatEur } from '../lib/format';

interface MonthlyRequestsSectionProps {
  project: ProjectSummary;
  clientId: string | null;
  defaultSignature?: string;
}

const STATUS_LABEL: Record<MonthlyRequestStatus, string> = {
  submitted: 'Reçue',
  in_progress: 'En cours',
  done: 'Traitée',
  declined: 'Refusée',
};

const STATUS_TONE: Record<MonthlyRequestStatus, string> = {
  submitted: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  in_progress: 'bg-amber-500/12 text-amber-300 border-amber-500/35',
  done: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/35',
  declined: 'bg-red-500/12 text-red-300 border-red-500/35',
};

/** Clé "YYYY-MM" d'un timestamp ISO — regroupement mensuel. */
function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthlyRequestsSection({
  project,
  clientId,
  defaultSignature,
}: MonthlyRequestsSectionProps) {
  const quota = project.monthly_request_quota ?? 0;
  const price = project.monthly_extra_request_price ?? 20;

  const { items, loading, submitRequest } = useMonthlyRequests(project.id, clientId);

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [signature, setSignature] = useState(defaultSignature ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentMonth = useMemo(() => monthKey(new Date().toISOString()), []);

  // Étiquette "supplémentaire" : dans chaque mois, les demandes au-delà du quota.
  const extraIds = useMemo(() => {
    const byMonth = new Map<string, MonthlyRequest[]>();
    for (const r of items) {
      const k = monthKey(r.created_at);
      const arr = byMonth.get(k) ?? [];
      arr.push(r);
      byMonth.set(k, arr);
    }
    const ids = new Set<string>();
    for (const arr of byMonth.values()) {
      const asc = arr.slice().sort((a, b) => a.created_at.localeCompare(b.created_at));
      asc.forEach((r, idx) => {
        if (idx >= quota) ids.add(r.id);
      });
    }
    return ids;
  }, [items, quota]);

  // Module réservé aux clients ayant un forfait (quota configuré côté CRM).
  if (quota <= 0) return null;

  const usedThisMonth = items.filter((r) => monthKey(r.created_at) === currentMonth).length;
  const remaining = Math.max(0, quota - usedThisMonth);
  const overQuota = usedThisMonth >= quota;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitRequest({ content, signature });
      setContent('');
      setShowForm(false);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Inbox size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">Mes demandes mensuelles</h3>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-[0.18em] ${
              overQuota
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-ws-accent/12 border-ws-accent/35 text-ws-accent'
            }`}
          >
            {remaining} / {quota} restante{remaining > 1 ? 's' : ''} ce mois
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ws-accent/15 hover:bg-ws-accent/25 border border-ws-accent/40 text-ws-accent text-xs font-mono uppercase tracking-[0.15em] transition-colors"
        >
          <Plus size={12} />
          {showForm ? 'Annuler' : 'Nouvelle demande'}
        </button>
      </header>

      {/* Bandeau d'information sur le quota */}
      <div className="px-5 py-3 border-b border-ws-line bg-ws-deep/15">
        {overQuota ? (
          <p className="text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
            <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
            <span>
              Vous avez utilisé vos <strong>{quota}</strong> demandes incluses ce mois-ci. Chaque
              demande supplémentaire est facturée <strong>{formatEur(price)}</strong> — ou fait
              l'objet d'un devis si elle est plus complexe. Votre compteur se réinitialise le mois
              prochain.
            </span>
          </p>
        ) : (
          <p className="text-xs text-ws-mist leading-relaxed">
            Votre forfait inclut <strong className="text-ws-paper">{quota}</strong> demandes par
            mois. Il vous en reste <strong className="text-ws-paper">{remaining}</strong> ce mois-ci.
          </p>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="px-5 py-4 border-b border-ws-line bg-ws-deep/15 space-y-3">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
              Votre demande
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Décrivez précisément ce que vous souhaitez (modification, ajout, correction…)."
              className="w-full px-3 py-2.5 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm placeholder:text-ws-mist/60 focus:outline-none focus:border-ws-accent/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
              Signature (votre nom)
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Ex. Linda Dupont"
              className="w-full px-3 py-2.5 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm placeholder:text-ws-mist/60 focus:outline-none focus:border-ws-accent/50"
            />
          </div>
          {overQuota && (
            <p className="text-[11px] text-amber-200/80 font-mono">
              Cette demande sera comptée comme supplémentaire ({formatEur(price)} ou sur devis).
            </p>
          )}
          {submitError && <p className="text-xs text-red-300 font-mono">{submitError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg border border-ws-line text-ws-mist hover:text-ws-paper text-xs font-mono uppercase tracking-[0.15em]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ws-accent text-ws-void text-xs font-semibold uppercase tracking-[0.15em] disabled:opacity-50 hover:brightness-110"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Envoyer
            </button>
          </div>
        </form>
      )}

      {loading && items.length === 0 ? (
        <div className="px-5 py-8 flex items-center justify-center gap-2 text-ws-mist">
          <Loader2 size={14} className="animate-spin" />
          <span className="font-mono text-xs">Chargement…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-ws-mist">Aucune demande pour l'instant.</p>
          <p className="text-xs text-ws-mist/70 mt-1">
            Utilisez ce module pour nous transmettre vos demandes du mois.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-ws-line/60">
          {items.map((r) => (
            <div key={r.id} className="px-5 py-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-[0.15em] ${STATUS_TONE[r.status]}`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
                {extraIds.has(r.id) ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[9px] font-mono uppercase tracking-[0.15em]">
                    Supplémentaire · {formatEur(r.custom_price ?? price)}
                    {r.custom_price != null && ' · tarif spécifique'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[9px] font-mono uppercase tracking-[0.15em]">
                    <CheckCircle2 size={9} className="mr-1" /> Incluse
                  </span>
                )}
                <span className="text-[10px] font-mono text-ws-mist">{formatDateTime(r.created_at)}</span>
              </div>
              <p className="text-sm text-ws-paper whitespace-pre-wrap leading-relaxed">{r.content}</p>
              {r.admin_notes && (
                <p className="text-xs text-ws-ink border-l-2 border-ws-accent/40 pl-3 leading-relaxed whitespace-pre-wrap">
                  {r.admin_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
