import { useMemo, useRef, useState } from 'react';
import {
  MailQuestion,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  XCircle,
  Eye,
} from 'lucide-react';
import type { ClientDocument } from '../lib/types';
import { useResourceRequests } from '../hooks/useResourceRequests';
import { formatDateShort } from '../lib/format';

interface RequestedResourcesSectionProps {
  documents: ClientDocument[];
  onRefresh?: () => void | Promise<void>;
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-ws-deep/40 text-ws-mist border-ws-line',
  normal: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  high: 'bg-amber-500/12 text-amber-300 border-amber-500/35',
  urgent: 'bg-red-500/12 text-red-300 border-red-500/35',
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Faible',
  normal: 'Normale',
  high: 'Élevée',
  urgent: 'Urgente',
};

export function RequestedResourcesSection({
  documents,
  onRefresh,
}: RequestedResourcesSectionProps) {
  const { respond, getSignedUrl } = useResourceRequests();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // On ne garde que les demandes (is_request = true) et on les trie : à faire d'abord
  const requests = useMemo(() => {
    return documents
      .filter((d) => d.is_request)
      .sort((a, b) => {
        // Pending d'abord, puis received, puis validated
        const order = (s: ClientDocument['request_status']): number =>
          s === 'requested' ? 0 : s === 'received' ? 1 : 2;
        const oa = order(a.request_status);
        const ob = order(b.request_status);
        if (oa !== ob) return oa - ob;
        // Puis par priority desc, puis due date asc
        const pPrio: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
        const pa = pPrio[a.request_priority] ?? 4;
        const pb = pPrio[b.request_priority] ?? 4;
        if (pa !== pb) return pa - pb;
        if (a.request_due_date && b.request_due_date) {
          return a.request_due_date.localeCompare(b.request_due_date);
        }
        return b.created_at.localeCompare(a.created_at);
      });
  }, [documents]);

  const stats = useMemo(() => {
    const todo = requests.filter((r) => r.request_status === 'requested').length;
    const review = requests.filter((r) => r.request_status === 'received').length;
    const done = requests.filter((r) => r.request_status === 'validated').length;
    return { todo, review, done, total: requests.length };
  }, [requests]);

  if (requests.length === 0) return null;

  const handleUpload = async (request: ClientDocument, file: File | null) => {
    if (!file) return;
    setUploadingId(request.id);
    setError(null);
    try {
      await respond(request, file);
      await onRefresh?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleView = async (request: ClientDocument) => {
    if (!request.file_path) return;
    setPreviewingId(request.id);
    try {
      const url = await getSignedUrl(request.file_path);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setPreviewingId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <MailQuestion size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">
            Documents demandés
          </h3>
          {stats.todo > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ws-accent/15 border border-ws-accent/40 text-ws-accent text-[10px] font-mono uppercase tracking-[0.18em]">
              {stats.todo} à fournir
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-ws-mist">
          <span>
            <strong className="text-ws-paper">{stats.done}</strong>/{stats.total} validés
          </span>
        </div>
      </header>

      {error && (
        <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      <div className="divide-y divide-ws-line/60">
        {requests.map((req) => {
          const status = req.request_status ?? 'requested';
          const overdue =
            req.request_due_date &&
            status === 'requested' &&
            new Date(req.request_due_date) < new Date(new Date().toDateString());

          const statusConfig =
            status === 'validated'
              ? {
                  bg: 'bg-emerald-500/8',
                  badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
                  label: 'Validé',
                  icon: <CheckCircle2 size={11} />,
                }
              : status === 'received'
                ? {
                    bg: 'bg-amber-500/5',
                    badge: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
                    label: 'En attente de validation',
                    icon: <Clock size={11} />,
                  }
                : {
                    bg: req.rejection_reason ? 'bg-red-500/5' : 'bg-sky-500/5',
                    badge: req.rejection_reason
                      ? 'bg-red-500/12 border-red-500/35 text-red-300'
                      : 'bg-sky-500/12 border-sky-500/35 text-sky-300',
                    label: req.rejection_reason ? 'À refaire' : 'À fournir',
                    icon: <AlertCircle size={11} />,
                  };

          const isUploading = uploadingId === req.id;
          const isPreview = previewingId === req.id;

          return (
            <div
              key={req.id}
              className={`px-5 py-4 ${statusConfig.bg} flex items-start gap-4 flex-wrap md:flex-nowrap`}
            >
              <div className="flex-shrink-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${statusConfig.badge}`}
                >
                  <FileText size={16} strokeWidth={2} />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-ws-paper">{req.name}</p>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-[0.15em] ${statusConfig.badge}`}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                  {req.request_priority !== 'normal' && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-[0.15em] ${PRIORITY_BADGE[req.request_priority]}`}
                    >
                      {PRIORITY_LABEL[req.request_priority]}
                    </span>
                  )}
                </div>
                {req.description && (
                  <p className="text-xs text-ws-ink leading-relaxed">{req.description}</p>
                )}
                {req.rejection_reason && (
                  <p className="text-xs text-red-300/90 leading-relaxed bg-red-500/[0.05] border border-red-500/20 rounded-md px-2 py-1.5">
                    <strong>Motif du refus :</strong> {req.rejection_reason}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap text-[10px] font-mono">
                  {req.request_due_date && (
                    <span
                      className={`flex items-center gap-1 ${
                        overdue ? 'text-red-300' : 'text-ws-mist'
                      }`}
                    >
                      <Calendar size={9} />
                      {overdue ? 'En retard depuis' : 'À fournir avant'}{' '}
                      {formatDateShort(req.request_due_date)}
                    </span>
                  )}
                  {req.received_at && (
                    <span className="flex items-center gap-1 text-ws-mist">
                      <Upload size={9} />
                      Envoyé le {formatDateShort(req.received_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                {req.file_path && (
                  <button
                    type="button"
                    onClick={() => handleView(req)}
                    disabled={isPreview}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ws-line bg-ws-deep/40 text-ws-mist hover:text-ws-paper hover:border-ws-accent/30 transition-colors text-xs font-mono uppercase tracking-[0.15em] disabled:opacity-50"
                  >
                    {isPreview ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                    Voir
                  </button>
                )}

                {(status === 'requested' || (status === 'received' && req.rejection_reason)) && (
                  <>
                    <input
                      ref={(el) => {
                        fileInputs.current[req.id] = el;
                      }}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        e.target.value = '';
                        if (f) void handleUpload(req, f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputs.current[req.id]?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ws-accent/15 hover:bg-ws-accent/25 border border-ws-accent/40 text-ws-accent text-xs font-mono uppercase tracking-[0.15em] transition-colors disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : status === 'requested' && req.rejection_reason ? (
                        <XCircle size={12} />
                      ) : (
                        <Upload size={12} />
                      )}
                      {isUploading
                        ? 'Envoi...'
                        : req.file_path
                          ? 'Renvoyer'
                          : 'Téléverser'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
