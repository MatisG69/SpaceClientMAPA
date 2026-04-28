import { useMemo, useState } from 'react';
import {
  GitPullRequestArrow,
  ClipboardCheck,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Users,
  Video,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  ChangeRequestStatus,
  ChangeRequestUrgency,
  MeetingKind,
} from '../lib/types';
import { useClientCollaboration } from '../hooks/useClientCollaboration';
import { formatDateShort, formatDateTime, formatEur } from '../lib/format';

interface ClientCollaborationSectionProps {
  projectId: string;
  clientId: string;
  defaultSignature?: string;
}

const URGENCY_LABEL: Record<ChangeRequestUrgency, string> = {
  low: 'Faible',
  normal: 'Normale',
  high: 'Élevée',
  urgent: 'Urgente',
};

const URGENCY_TONE: Record<ChangeRequestUrgency, string> = {
  low: 'bg-ws-deep/40 text-ws-mist border-ws-line',
  normal: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  high: 'bg-amber-500/12 text-amber-300 border-amber-500/35',
  urgent: 'bg-red-500/12 text-red-300 border-red-500/35',
};

const STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  submitted: 'Soumise',
  estimated: 'Estimation reçue',
  approved: 'Approuvée',
  rejected: 'Refusée',
  completed: 'Réalisée',
};

const STATUS_TONE: Record<ChangeRequestStatus, string> = {
  submitted: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  estimated: 'bg-amber-500/12 text-amber-300 border-amber-500/35',
  approved: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/35',
  rejected: 'bg-red-500/12 text-red-300 border-red-500/35',
  completed: 'bg-ws-accent/15 text-ws-accent border-ws-accent/40',
};

const MEETING_KIND_ICON: Record<MeetingKind, JSX.Element> = {
  visio: <Video size={11} />,
  physique: <MapPin size={11} />,
  telephone: <Phone size={11} />,
  autre: <Users size={11} />,
};

const MEETING_KIND_LABEL: Record<MeetingKind, string> = {
  visio: 'Visio',
  physique: 'Physique',
  telephone: 'Téléphone',
  autre: 'Autre',
};

export function ClientCollaborationSection({
  projectId,
  clientId,
  defaultSignature,
}: ClientCollaborationSectionProps) {
  const {
    changeRequests,
    meetingNotes,
    loading,
    error,
    submitChangeRequest,
    approveEstimate,
    rejectEstimate,
    validateMeetingNote,
  } = useClientCollaboration(projectId, clientId);

  if (loading && changeRequests.length === 0 && meetingNotes.length === 0) {
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

      <ChangeRequestsBlock
        items={changeRequests}
        defaultSignature={defaultSignature ?? ''}
        onSubmit={submitChangeRequest}
        onApprove={approveEstimate}
        onReject={rejectEstimate}
      />

      <MeetingNotesBlock
        items={meetingNotes}
        defaultSignature={defaultSignature ?? ''}
        onValidate={validateMeetingNote}
      />
    </div>
  );
}

/* ─── Change requests ─── */

function ChangeRequestsBlock({
  items,
  defaultSignature,
  onSubmit,
  onApprove,
  onReject,
}: {
  items: import('../lib/types').ChangeRequest[];
  defaultSignature: string;
  onSubmit: (input: {
    description: string;
    urgency: ChangeRequestUrgency;
    signature: string;
  }) => Promise<unknown>;
  onApprove: (id: string, signature: string) => Promise<unknown>;
  onReject: (id: string, reason: string) => Promise<unknown>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<ChangeRequestUrgency>('normal');
  const [signature, setSignature] = useState(defaultSignature);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pending = items.filter((i) => i.status === 'estimated').length;
    const inFlight = items.filter((i) => i.status === 'approved').length;
    return { pending, inFlight, total: items.length };
  }, [items]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({ description, urgency, signature });
      setDescription('');
      setUrgency('normal');
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
          <GitPullRequestArrow size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">
            Demandes de modification
          </h3>
          {stats.pending > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase tracking-[0.18em]">
              {stats.pending} estimation{stats.pending > 1 ? 's' : ''} à valider
            </span>
          )}
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

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="px-5 py-4 border-b border-ws-line bg-ws-deep/15 space-y-3"
        >
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
              Description précise de la demande
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Décrivez la modification souhaitée, les écrans concernés, le contexte d'usage…"
              className="w-full px-3 py-2.5 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm placeholder:text-ws-mist/60 focus:outline-none focus:border-ws-accent/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1.5">
                Urgence
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as ChangeRequestUrgency)}
                className="w-full px-3 py-2.5 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
              >
                {(Object.keys(URGENCY_LABEL) as ChangeRequestUrgency[]).map((k) => (
                  <option key={k} value={k}>
                    {URGENCY_LABEL[k]}
                  </option>
                ))}
              </select>
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
          </div>
          {submitError && (
            <p className="text-xs text-red-300 font-mono">{submitError}</p>
          )}
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
              disabled={submitting || !description.trim()}
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
            Aucune demande de modification pour ce projet.
          </p>
          <p className="text-xs text-ws-mist/70 mt-1">
            Utilisez ce module pour formaliser toute évolution post-cadrage : nous chiffrons puis vous validez avant exécution.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-ws-line/60">
          {items.map((cr) => (
            <ChangeRequestRow
              key={cr.id}
              cr={cr}
              defaultSignature={defaultSignature}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ChangeRequestRow({
  cr,
  defaultSignature,
  onApprove,
  onReject,
}: {
  cr: import('../lib/types').ChangeRequest;
  defaultSignature: string;
  onApprove: (id: string, signature: string) => Promise<unknown>;
  onReject: (id: string, reason: string) => Promise<unknown>;
}) {
  const [signature, setSignature] = useState(defaultSignature);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);

  const handleApprove = async () => {
    setBusy('approve');
    setRowError(null);
    try {
      await onApprove(cr.id, signature);
    } catch (e) {
      setRowError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async () => {
    setBusy('reject');
    setRowError(null);
    try {
      await onReject(cr.id, reason);
      setShowReject(false);
    } catch (e) {
      setRowError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const isPending = cr.status === 'estimated';

  return (
    <div className="px-5 py-4 space-y-2.5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-[0.15em] ${STATUS_TONE[cr.status]}`}
          >
            {STATUS_LABEL[cr.status]}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-[0.15em] ${URGENCY_TONE[cr.urgency]}`}
          >
            {URGENCY_LABEL[cr.urgency]}
          </span>
          <span className="text-[10px] font-mono text-ws-mist">
            soumis {formatDateTime(cr.submitted_at)}
          </span>
        </div>
      </div>

      <p className="text-sm text-ws-paper whitespace-pre-wrap leading-relaxed">
        {cr.description}
      </p>

      {cr.estimated_days != null && cr.estimated_amount != null && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] px-3.5 py-2.5">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-300/80 mb-1.5">
            Estimation
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="text-ws-paper">
              <strong className="font-mono tabular-nums">{cr.estimated_days}</strong> j
            </span>
            <span className="text-ws-paper">
              <strong className="font-mono tabular-nums">{formatEur(cr.estimated_amount)}</strong>{' '}
              <span className="text-ws-mist text-xs">HT</span>
            </span>
          </div>
          {cr.admin_notes && (
            <p className="text-xs text-ws-ink mt-2 leading-relaxed whitespace-pre-wrap">
              {cr.admin_notes}
            </p>
          )}
        </div>
      )}

      {cr.status === 'approved' && cr.approved_at && (
        <p className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 size={11} />
          Approuvée le {formatDateTime(cr.approved_at)}
          {cr.approved_by_signature && ` — ${cr.approved_by_signature}`}
        </p>
      )}

      {cr.status === 'rejected' && cr.rejection_reason && (
        <div className="rounded-md border border-red-500/20 bg-red-500/[0.04] px-3 py-2 text-xs text-red-300/90">
          <strong>Motif du refus :</strong> {cr.rejection_reason}
        </div>
      )}

      {isPending && !showReject && (
        <div className="flex flex-wrap items-end gap-2 pt-1">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[9px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1">
              Signature pour approuver
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Votre nom"
              className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-xs placeholder:text-ws-mist/60 focus:outline-none focus:border-ws-accent/50"
            />
          </div>
          <button
            type="button"
            onClick={handleApprove}
            disabled={busy !== null || !signature.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono uppercase tracking-[0.15em] disabled:opacity-50"
          >
            {busy === 'approve' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Approuver
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs font-mono uppercase tracking-[0.15em] disabled:opacity-50"
          >
            <XCircle size={12} />
            Refuser
          </button>
        </div>
      )}

      {isPending && showReject && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.04] p-3 space-y-2">
          <label className="block text-[9px] font-mono uppercase tracking-[0.18em] text-red-300/80">
            Motif du refus (optionnel)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Pourquoi refusez-vous l'estimation ?"
            className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-xs placeholder:text-ws-mist/60 focus:outline-none focus:border-red-500/40"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReject(false)}
              className="px-3 py-1.5 rounded-lg border border-ws-line text-ws-mist text-[11px] font-mono uppercase tracking-[0.15em]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-[11px] font-mono uppercase tracking-[0.15em] disabled:opacity-50"
            >
              {busy === 'reject' && <Loader2 size={11} className="animate-spin" />}
              Confirmer le refus
            </button>
          </div>
        </div>
      )}

      {rowError && (
        <p className="text-[11px] text-red-300 font-mono flex items-center gap-1">
          <AlertTriangle size={11} />
          {rowError}
        </p>
      )}
    </div>
  );
}

/* ─── Meeting notes ─── */

function MeetingNotesBlock({
  items,
  defaultSignature,
  onValidate,
}: {
  items: import('../lib/types').MeetingNote[];
  defaultSignature: string;
  onValidate: (id: string, signature: string) => Promise<unknown>;
}) {
  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
        <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center gap-2">
          <ClipboardCheck size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">
            Comptes-rendus de réunion
          </h3>
        </header>
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-ws-mist">
            Aucun compte-rendu pour l'instant.
          </p>
          <p className="text-xs text-ws-mist/70 mt-1">
            Les décisions de chaque réunion seront consignées ici et validables d'un clic.
          </p>
        </div>
      </section>
    );
  }

  const stats = items.filter((m) => !m.validated_at).length;

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center gap-2 flex-wrap">
        <ClipboardCheck size={15} className="text-ws-accent" />
        <h3 className="font-display text-base font-semibold text-ws-paper">
          Comptes-rendus de réunion
        </h3>
        {stats > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase tracking-[0.18em]">
            {stats} à valider
          </span>
        )}
      </header>
      <div className="divide-y divide-ws-line/60">
        {items.map((mn) => (
          <MeetingNoteRow
            key={mn.id}
            note={mn}
            defaultSignature={defaultSignature}
            onValidate={onValidate}
          />
        ))}
      </div>
    </section>
  );
}

function MeetingNoteRow({
  note,
  defaultSignature,
  onValidate,
}: {
  note: import('../lib/types').MeetingNote;
  defaultSignature: string;
  onValidate: (id: string, signature: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(!note.validated_at);
  const [signature, setSignature] = useState(defaultSignature);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const handleValidate = async () => {
    setBusy(true);
    setRowError(null);
    try {
      await onValidate(note.id, signature);
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
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-ws-line bg-ws-deep/40 text-ws-mist text-[9px] font-mono uppercase tracking-[0.15em]">
            {MEETING_KIND_ICON[note.meeting_kind]}
            {MEETING_KIND_LABEL[note.meeting_kind]}
          </span>
          <span className="text-sm font-medium text-ws-paper truncate">{note.title}</span>
          {note.validated_at ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono uppercase tracking-[0.15em]">
              <CheckCircle2 size={10} /> Validé
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/12 border border-amber-500/40 text-amber-300 text-[9px] font-mono uppercase tracking-[0.15em]">
              À valider
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-ws-mist flex-shrink-0">
          <Calendar size={10} />
          <span>{formatDateShort(note.meeting_date)}</span>
          {note.meeting_duration_minutes != null && (
            <span>· {note.meeting_duration_minutes} min</span>
          )}
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3 pt-3 border-t border-ws-line/60">
          {note.meeting_attendees && (
            <p className="text-xs text-ws-mist font-mono flex items-center gap-1.5">
              <Users size={11} />
              {note.meeting_attendees}
            </p>
          )}

          {note.decisions && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1">
                Décisions
              </p>
              <p className="text-sm text-ws-paper whitespace-pre-wrap leading-relaxed">
                {note.decisions}
              </p>
            </div>
          )}

          {note.actions && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1">
                Actions
              </p>
              <p className="text-sm text-ws-paper whitespace-pre-wrap leading-relaxed">
                {note.actions}
              </p>
            </div>
          )}

          {note.next_steps && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1">
                Prochaines étapes
              </p>
              <p className="text-sm text-ws-paper whitespace-pre-wrap leading-relaxed">
                {note.next_steps}
              </p>
            </div>
          )}

          {note.validated_at ? (
            <p className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 pt-1">
              <CheckCircle2 size={11} />
              Validé le {formatDateTime(note.validated_at)}
              {note.validated_by_signature && ` — ${note.validated_by_signature}`}
            </p>
          ) : (
            <div className="flex flex-wrap items-end gap-2 pt-1">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[9px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1">
                  Signer le compte-rendu
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full px-3 py-2 rounded-lg bg-ws-deep/50 border border-ws-line text-ws-paper text-xs placeholder:text-ws-mist/60 focus:outline-none focus:border-ws-accent/50"
                />
              </div>
              <button
                type="button"
                onClick={handleValidate}
                disabled={busy || !signature.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ws-accent text-ws-void text-xs font-semibold uppercase tracking-[0.15em] disabled:opacity-50 hover:brightness-110"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Valider
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
