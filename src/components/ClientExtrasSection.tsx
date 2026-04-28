import { useState } from 'react';
import {
  Star,
  ShieldCheck,
  Lightbulb,
  Loader2,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Lock,
  CheckCheck,
} from 'lucide-react';
import { useClientExtras } from '../hooks/useClientExtras';
import type {
  NdaAgreement,
  ProjectSuggestion,
  SuggestionKind,
  Testimonial,
} from '../lib/types';
import { formatDateLong, formatDateTime } from '../lib/format';

interface ClientExtrasSectionProps {
  projectId: string;
  clientId: string;
  defaultSignature?: string;
}

const KIND_LABEL: Record<SuggestionKind, string> = {
  feature: 'Fonctionnalité',
  improvement: 'Amélioration',
  bug: 'Bug / souci',
  question: 'Question',
  other: 'Autre',
};

export function ClientExtrasSection({
  projectId,
  clientId,
  defaultSignature,
}: ClientExtrasSectionProps) {
  const {
    testimonials,
    ndas,
    suggestions,
    loading,
    error,
    submitTestimonial,
    signNda,
    submitSuggestion,
  } = useClientExtras(projectId, clientId);

  if (loading && !testimonials.length && !ndas.length && !suggestions.length) {
    return (
      <section className="rounded-3xl border border-ws-line bg-ws-panel/60 p-6 flex items-center justify-center gap-2 text-ws-mist">
        <Loader2 size={14} className="animate-spin" />
        <span className="font-mono text-xs">Chargement…</span>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      <NdaList items={ndas} defaultSignature={defaultSignature ?? ''} onSign={signNda} />

      <SuggestionsList
        items={suggestions}
        defaultSignature={defaultSignature ?? ''}
        onSubmit={submitSuggestion}
      />

      <TestimonialsList
        items={testimonials}
        defaultSignature={defaultSignature ?? ''}
        onSubmit={submitTestimonial}
      />
    </div>
  );
}

/* ─── NDA ─── */

function NdaList({
  items,
  defaultSignature,
  onSign,
}: {
  items: NdaAgreement[];
  defaultSignature: string;
  onSign: (id: string, signature: string) => Promise<unknown>;
}) {
  if (items.length === 0) return null;
  const pending = items.filter((n) => n.status === 'sent').length;

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center gap-2 flex-wrap">
        <ShieldCheck size={15} className="text-ws-accent" />
        <h3 className="font-display text-base font-semibold text-ws-paper">
          Accords de confidentialité
        </h3>
        {pending > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase tracking-[0.18em]">
            {pending} à signer
          </span>
        )}
      </header>
      <div className="divide-y divide-ws-line/60">
        {items.map((n) => (
          <NdaRow key={n.id} nda={n} defaultSignature={defaultSignature} onSign={onSign} />
        ))}
      </div>
    </section>
  );
}

function NdaRow({
  nda,
  defaultSignature,
  onSign,
}: {
  nda: NdaAgreement;
  defaultSignature: string;
  onSign: (id: string, signature: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(nda.status === 'sent');
  const [signature, setSignature] = useState(defaultSignature);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const isSigned = nda.status === 'signed' && nda.signed_at;
  const canSign = nda.status === 'sent';

  const handleSign = async () => {
    setBusy(true);
    setRowError(null);
    try {
      await onSign(nda.id, signature);
    } catch (e) {
      setRowError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Lock size={12} className="text-ws-mist flex-shrink-0" />
          <span className="text-sm font-medium text-ws-paper truncate">{nda.title}</span>
          {isSigned ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono uppercase tracking-[0.15em]">
              <CheckCheck size={10} /> Signé
            </span>
          ) : nda.status === 'sent' ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/12 border border-amber-500/40 text-amber-300 text-[9px] font-mono uppercase tracking-[0.15em]">
              À signer
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-ws-deep/40 border border-ws-line text-ws-mist text-[9px] font-mono uppercase tracking-[0.15em]">
              {nda.status}
            </span>
          )}
        </div>
        {nda.expires_at && (
          <span className="text-[10px] font-mono text-ws-mist flex-shrink-0">
            expire {formatDateLong(nda.expires_at)}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-ws-line/60 space-y-3">
          <pre className="text-xs text-ws-paper/90 leading-relaxed font-sans whitespace-pre-wrap bg-ws-deep/40 border border-ws-line rounded-xl px-4 py-3 max-h-[420px] overflow-y-auto">
{nda.content}
          </pre>

          {isSigned && (
            <p className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 size={11} />
              Signé le {formatDateTime(nda.signed_at)}
              {nda.signed_by_signature && ` — ${nda.signed_by_signature}`}
            </p>
          )}

          {canSign && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[9px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1">
                  Signature (votre nom complet)
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Linda Dupont"
                  className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-xs placeholder:text-ws-mist/60 focus:outline-none focus:border-ws-accent/50"
                />
              </div>
              <button
                type="button"
                onClick={handleSign}
                disabled={busy || !signature.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ws-accent text-ws-void text-xs font-semibold uppercase tracking-[0.15em] disabled:opacity-50 hover:brightness-110"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Signer
              </button>
            </div>
          )}

          {rowError && (
            <p className="text-[11px] text-red-300 font-mono flex items-center gap-1">
              <AlertTriangle size={11} />
              {rowError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Suggestions ─── */

function SuggestionsList({
  items,
  defaultSignature,
  onSubmit,
}: {
  items: ProjectSuggestion[];
  defaultSignature: string;
  onSubmit: (input: {
    title: string;
    description?: string | null;
    kind: SuggestionKind;
    signature?: string | null;
  }) => Promise<unknown>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<SuggestionKind>('feature');
  const [signature, setSignature] = useState(defaultSignature);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Lightbulb size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">
            Boîte à idées
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ws-accent/15 hover:bg-ws-accent/25 border border-ws-accent/40 text-ws-accent text-xs font-mono uppercase tracking-[0.15em]"
        >
          <Plus size={12} />
          {showForm ? 'Annuler' : 'Nouvelle idée'}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setSubmitError(null);
            try {
              await onSubmit({ title, description, kind, signature });
              setTitle('');
              setDescription('');
              setKind('feature');
              setShowForm(false);
            } catch (err) {
              setSubmitError((err as Error).message);
            } finally {
              setSubmitting(false);
            }
          }}
          className="px-5 py-4 border-b border-ws-line bg-ws-deep/15 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
                Idée en un titre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ajouter un système de réservation en ligne"
                className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
                Type
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as SuggestionKind)}
                className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
              >
                {(Object.keys(KIND_LABEL) as SuggestionKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
              Description (contexte, objectif, exemples)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Détaillez le besoin ou l'amélioration. Plus c'est précis, mieux on peut chiffrer."
              className="w-full px-3 py-2.5 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
              Signature (optionnel)
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Votre nom"
              className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
            />
          </div>
          {submitError && (
            <p className="text-xs text-red-300 font-mono">{submitError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg border border-ws-line text-ws-mist text-xs font-mono uppercase tracking-[0.15em]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ws-accent text-ws-void text-xs font-semibold uppercase tracking-[0.15em] disabled:opacity-50 hover:brightness-110"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Soumettre
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-ws-mist">
            Aucune idée soumise pour l'instant.
          </p>
          <p className="text-xs text-ws-mist/70 mt-1">
            Partagez vos idées d'évolution, on les chiffre et planifie ensemble.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-ws-line/60">
          {items.map((s) => (
            <div key={s.id} className="px-5 py-4 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-ws-line bg-ws-deep/40 text-ws-mist text-[9px] font-mono uppercase tracking-[0.15em]">
                  {KIND_LABEL[s.kind]}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full border border-ws-line bg-ws-deep/40 text-ws-mist text-[9px] font-mono uppercase tracking-[0.15em]">
                  {s.status}
                </span>
                <p className="text-sm font-medium text-ws-paper">{s.title}</p>
              </div>
              {s.description && (
                <p className="text-sm text-ws-paper/80 whitespace-pre-wrap leading-relaxed">
                  {s.description}
                </p>
              )}
              {s.admin_response && (
                <div className="rounded-md border border-ws-accent/25 bg-ws-accent/[0.04] px-3 py-2 text-xs text-ws-paper">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-accent/80 mb-1">
                    Réponse MAPA
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">{s.admin_response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Témoignages ─── */

function TestimonialsList({
  items,
  defaultSignature,
  onSubmit,
}: {
  items: Testimonial[];
  defaultSignature: string;
  onSubmit: (input: {
    rating: number;
    content: string;
    authorSignature: string;
    authorRole?: string | null;
    allowPublic: boolean;
    allowLogo: boolean;
  }) => Promise<unknown>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [authorSig, setAuthorSig] = useState(defaultSignature);
  const [authorRole, setAuthorRole] = useState('');
  const [allowPublic, setAllowPublic] = useState(true);
  const [allowLogo, setAllowLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const myTestimonial = items[0];

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Star size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">
            Votre témoignage
          </h3>
        </div>
        {!myTestimonial && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ws-accent/15 hover:bg-ws-accent/25 border border-ws-accent/40 text-ws-accent text-xs font-mono uppercase tracking-[0.15em]"
          >
            <Plus size={12} />
            {showForm ? 'Annuler' : 'Laisser un avis'}
          </button>
        )}
      </header>

      {showForm && !myTestimonial && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            setSubmitError(null);
            try {
              await onSubmit({
                rating,
                content,
                authorSignature: authorSig,
                authorRole,
                allowPublic,
                allowLogo,
              });
              setContent('');
              setShowForm(false);
            } catch (err) {
              setSubmitError((err as Error).message);
            } finally {
              setSubmitting(false);
            }
          }}
          className="px-5 py-4 border-b border-ws-line bg-ws-deep/15 space-y-3"
        >
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
              Note
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1 transition-colors"
                >
                  <Star
                    size={22}
                    className={n <= rating ? 'text-amber-300' : 'text-ws-line'}
                    fill={n <= rating ? 'currentColor' : 'transparent'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-mono text-ws-mist">{rating}/5</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
              Votre avis
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              placeholder="Ce qui vous a convaincu, ce que vous recommanderiez à d'autres clients…"
              className="w-full px-3 py-2.5 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
                Votre nom
              </label>
              <input
                type="text"
                value={authorSig}
                onChange={(e) => setAuthorSig(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
                Rôle / société (affiché publiquement)
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="Gérante, Le Fellini"
                className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
              />
            </div>
          </div>

          <div className="rounded-xl border border-ws-line bg-ws-deep/30 p-3 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPublic}
                onChange={(e) => setAllowPublic(e.target.checked)}
                className="mt-1"
              />
              <span className="text-xs text-ws-paper">
                <strong>J'autorise MAPA Développement à diffuser ce témoignage</strong>{' '}
                (site web, supports commerciaux). Vous pouvez retirer cette autorisation à tout moment par email.
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowLogo}
                onChange={(e) => setAllowLogo(e.target.checked)}
                className="mt-1"
              />
              <span className="text-xs text-ws-paper">
                J'autorise également l'utilisation du logo de mon entreprise.
              </span>
            </label>
          </div>

          {submitError && (
            <p className="text-xs text-red-300 font-mono">{submitError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg border border-ws-line text-ws-mist text-xs font-mono uppercase tracking-[0.15em]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim() || !authorSig.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ws-accent text-ws-void text-xs font-semibold uppercase tracking-[0.15em] disabled:opacity-50 hover:brightness-110"
            >
              {submitting && <Loader2 size={12} className="animate-spin" />}
              Envoyer
            </button>
          </div>
        </form>
      )}

      {myTestimonial && (
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-0.5 text-amber-300">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < myTestimonial.rating ? 'currentColor' : 'transparent'}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-ws-mist">
              · soumis {formatDateTime(myTestimonial.signed_at)}
            </span>
            {myTestimonial.approved && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono uppercase tracking-[0.15em]">
                <CheckCheck size={10} /> Publié
              </span>
            )}
          </div>
          <p className="text-sm text-ws-paper whitespace-pre-wrap leading-relaxed">
            « {myTestimonial.content} »
          </p>
          <p className="text-xs text-ws-mist font-mono mt-2">
            — {myTestimonial.author_signature}
            {myTestimonial.author_role && (
              <span className="text-ws-mist/70"> · {myTestimonial.author_role}</span>
            )}
          </p>
        </div>
      )}

      {!myTestimonial && !showForm && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-ws-mist">
            Une fois votre projet livré, partagez votre retour d'expérience.
          </p>
        </div>
      )}
    </section>
  );
}
