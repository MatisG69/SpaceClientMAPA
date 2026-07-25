import { useState } from 'react';
import {
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  Video,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MeetingKind, MeetingNote } from '../lib/types';
import { useClientCollaboration } from '../hooks/useClientCollaboration';
import { formatDateShort, formatDateTime } from '../lib/format';

interface ClientCollaborationSectionProps {
  projectId: string;
  clientId: string;
  defaultSignature?: string;
}

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

/**
 * Collaboration projet côté client : comptes-rendus de réunion validables.
 * (Le bloc « Demandes de modification » a été retiré au profit du module
 * « Mes demandes mensuelles ».)
 */
export function ClientCollaborationSection({
  projectId,
  clientId,
  defaultSignature,
}: ClientCollaborationSectionProps) {
  const { meetingNotes, loading, error, validateMeetingNote } = useClientCollaboration(
    projectId,
    clientId,
  );

  if (loading && meetingNotes.length === 0) {
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

      <MeetingNotesBlock
        items={meetingNotes}
        defaultSignature={defaultSignature ?? ''}
        onValidate={validateMeetingNote}
      />
    </div>
  );
}

/* ─── Meeting notes ─── */

function MeetingNotesBlock({
  items,
  defaultSignature,
  onValidate,
}: {
  items: MeetingNote[];
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
          <p className="text-sm text-ws-mist">Aucun compte-rendu pour l'instant.</p>
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
  note: MeetingNote;
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
