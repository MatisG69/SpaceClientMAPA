import { useMemo, useState } from 'react';
import {
  FileText,
  FileSignature,
  Receipt,
  FolderOpen,
  Download,
  Eye,
  Loader2,
  Calendar,
  X,
} from 'lucide-react';
import type { Client, ClientDocument, Invoice, Project, Quote } from '../lib/types';
import { formatDateShort, formatEur } from '../lib/format';
import { generateDevisHTML } from '../lib/devisGenerator';
import { generateInvoiceHTML, generatePairedInvoiceHTML, MAPA_VENDOR } from '../lib/invoiceGenerator';
import { supabase } from '../lib/supabase';

/**
 * Coordonnées bancaires affichées sur les factures.
 * Surchargeables via .env (VITE_MAPA_IBAN / VITE_MAPA_BIC) — fallback sur les coordonnées MAPA.
 * Variables publiques (visibles côté client) puisqu'elles figurent déjà sur les factures émises.
 */
const MAPA_IBAN =
  ((import.meta.env.VITE_MAPA_IBAN as string | undefined)?.trim() ||
    'FR76 1670 6050 8763 5180 1129 014');
const MAPA_BIC =
  ((import.meta.env.VITE_MAPA_BIC as string | undefined)?.trim() || 'AGRIFRPP867');

interface DocumentsSectionProps {
  client: Client | null;
  projects: Project[];
  quotes: Quote[];
  invoices: Invoice[];
  documents: ClientDocument[];
}

type DocKind = 'devis' | 'facture-acompte' | 'facture-solde' | 'facture' | 'upload';

interface UnifiedDoc {
  id: string;
  kind: DocKind;
  /** Date qui sert au tri chronologique (created_at ou équivalent) */
  date: string;
  /** Titre principal affiché */
  title: string;
  /** Sous-titre (numéro, projet…) */
  subtitle?: string;
  /** Statut affiché à droite (signed, paid, etc.) */
  statusLabel?: string;
  statusTone?: 'gold' | 'green' | 'red' | 'mist';
  /** Montant à droite — non affiché si null */
  amount?: number | null;
  /** Action quand le client clique « Voir » */
  onView: () => void;
  /** Nom de fichier pour le téléchargement */
  fileName: string;
}

const STATUS_QUOTE: Record<Quote['status'], { label: string; tone: 'gold' | 'green' | 'red' | 'mist' }> = {
  draft: { label: 'Brouillon', tone: 'mist' },
  sent: { label: 'Envoyé', tone: 'gold' },
  signed: { label: 'Signé', tone: 'green' },
  refused: { label: 'Refusé', tone: 'red' },
  expired: { label: 'Expiré', tone: 'mist' },
};

const STATUS_INVOICE: Record<Invoice['status'], { label: string; tone: 'gold' | 'green' | 'red' | 'mist' }> = {
  draft: { label: 'Brouillon', tone: 'mist' },
  sent: { label: 'En attente', tone: 'gold' },
  paid: { label: 'Réglée', tone: 'green' },
  overdue: { label: 'En retard', tone: 'red' },
  cancelled: { label: 'Annulée', tone: 'mist' },
};

const TONE_CLS: Record<'gold' | 'green' | 'red' | 'mist', string> = {
  gold: 'bg-ws-accent/15 text-ws-accent border-ws-accent/35',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  red: 'bg-red-500/12 text-red-300 border-red-500/35',
  mist: 'bg-ws-deep/40 text-ws-mist border-ws-line',
};

export function DocumentsSection({
  client,
  projects,
  quotes,
  invoices,
  documents,
}: DocumentsSectionProps) {
  const [filter, setFilter] = useState<'all' | 'devis' | 'facture' | 'upload'>('all');
  const [previewHtml, setPreviewHtml] = useState<{ html: string; filename: string } | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p] as const)), [projects]);

  const unified = useMemo<UnifiedDoc[]>(() => {
    const items: UnifiedDoc[] = [];

    // Devis
    for (const q of quotes) {
      const project = q.project_id ? projectById.get(q.project_id) ?? null : null;
      const status = STATUS_QUOTE[q.status];
      items.push({
        id: `quote-${q.id}`,
        kind: 'devis',
        date: q.created_at,
        title: q.title || 'Devis',
        subtitle: [q.quote_number, project?.name].filter(Boolean).join(' · '),
        statusLabel: status.label,
        statusTone: status.tone,
        amount: q.amount,
        fileName: `devis-${q.quote_number ?? q.id}.pdf`,
        onView: () => {
          if (!client) return;
          const html = generateDevisHTML({
            client: client as Client,
            project: project as Project | null,
            amount: q.amount,
            quoteNumber: q.quote_number ?? '',
            validUntilISO: q.valid_until,
            depositPercent:
              q.deposit_requested && q.deposit_amount && q.amount > 0
                ? Math.round((q.deposit_amount / q.amount) * 100)
                : 30,
            includeCGV: true,
            acompteDateISO: q.expected_acompte_date ?? null,
            deliveryDateISO: q.expected_delivery_date ?? null,
          });
          setPreviewHtml({ html, filename: `devis-${q.quote_number ?? q.id}.pdf` });
        },
      });
    }

    // Factures — détecte automatiquement acompte/solde via le notes ou le source_quote_id
    for (const inv of invoices) {
      const project = inv.project_id ? projectById.get(inv.project_id) ?? null : null;
      const status = STATUS_INVOICE[inv.status];
      const isAcompte = (inv.notes ?? '').toLowerCase().includes("facture d'acompte");
      const isSolde = (inv.notes ?? '').toLowerCase().includes('facture de solde');
      const kind: DocKind = isAcompte ? 'facture-acompte' : isSolde ? 'facture-solde' : 'facture';
      const titleSuffix = isAcompte ? "Facture d'acompte" : isSolde ? 'Facture de solde' : 'Facture';
      items.push({
        id: `invoice-${inv.id}`,
        kind,
        date: inv.created_at,
        title: titleSuffix,
        subtitle: [inv.invoice_number, project?.name].filter(Boolean).join(' · '),
        statusLabel: status.label,
        statusTone: status.tone,
        amount: inv.amount,
        fileName: `facture-${inv.invoice_number ?? inv.id}.pdf`,
        onView: () => {
          if (!client) return;
          const sourceQuote = quotes.find((q) => q.id === inv.source_quote_id) ?? null;
          const html = generateInvoiceHTML({
            client: client as Client,
            project: project as Project | null,
            totalAmount: inv.amount,
            invoiceNumber: inv.invoice_number ?? '',
            kind: 'full',
            issueDateISO: inv.created_at?.slice(0, 10),
            dueDateISO: inv.due_date ?? undefined,
            serviceDateISO: inv.due_date ?? inv.created_at?.slice(0, 10),
            sourceQuoteRef: sourceQuote?.quote_number ?? undefined,
            sourceQuoteSignedISO: sourceQuote?.signed_at?.slice(0, 10) ?? undefined,
            customNotes: inv.notes ?? undefined,
            iban: MAPA_IBAN,
            bic: MAPA_BIC,
            vendor: MAPA_VENDOR,
          });
          setPreviewHtml({ html, filename: `facture-${inv.invoice_number ?? inv.id}.pdf` });
        },
      });
    }

    // Documents arbitraires uploadés
    for (const d of documents) {
      const project = d.project_id ? projectById.get(d.project_id) ?? null : null;
      items.push({
        id: `doc-${d.id}`,
        kind: 'upload',
        date: d.created_at,
        title: d.name,
        subtitle: [d.category !== 'autre' ? labelizeCategory(d.category) : null, project?.name]
          .filter(Boolean)
          .join(' · '),
        amount: null,
        fileName: d.name,
        onView: async () => {
          setDownloadingDocId(d.id);
          try {
            const { data, error } = await supabase.storage
              .from('client-documents')
              .createSignedUrl(d.file_path, 60 * 5);
            if (error) throw error;
            if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
          } catch {
            /* erreur silencieuse — UI gère via downloadingDocId timeout */
          } finally {
            setDownloadingDocId(null);
          }
        },
      });
    }

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [client, projects, quotes, invoices, documents, projectById]);

  // suppress unused for tree-shake
  void generatePairedInvoiceHTML;

  const filtered = useMemo(() => {
    if (filter === 'all') return unified;
    if (filter === 'devis') return unified.filter((d) => d.kind === 'devis');
    if (filter === 'facture')
      return unified.filter(
        (d) => d.kind === 'facture' || d.kind === 'facture-acompte' || d.kind === 'facture-solde'
      );
    return unified.filter((d) => d.kind === 'upload');
  }, [unified, filter]);

  const counts = useMemo(
    () => ({
      all: unified.length,
      devis: unified.filter((d) => d.kind === 'devis').length,
      facture: unified.filter(
        (d) =>
          d.kind === 'facture' || d.kind === 'facture-acompte' || d.kind === 'facture-solde'
      ).length,
      upload: unified.filter((d) => d.kind === 'upload').length,
    }),
    [unified]
  );

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <FolderOpen size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">Mes documents</h3>
          <span className="text-xs font-mono text-ws-mist">({unified.length})</span>
        </div>
        {/* Filtres rapides */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-ws-deep/60 border border-ws-line text-[10px] font-mono uppercase tracking-[0.18em]">
          {(
            [
              ['all', `Tous · ${counts.all}`],
              ['devis', `Devis · ${counts.devis}`],
              ['facture', `Factures · ${counts.facture}`],
              ['upload', `Autres · ${counts.upload}`],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filter === k
                  ? 'bg-ws-panel text-ws-paper shadow-sm'
                  : 'text-ws-mist hover:text-ws-paper'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <div className="divide-y divide-ws-line/60">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <FileText size={22} className="mx-auto mb-3 text-ws-mist/60" />
            <p className="text-sm text-ws-paper font-medium mb-1">
              {filter === 'all'
                ? 'Aucun document pour le moment'
                : filter === 'devis'
                  ? 'Aucun devis émis'
                  : filter === 'facture'
                    ? 'Aucune facture émise'
                    : 'Aucun document partagé'}
            </p>
            <p className="text-xs text-ws-mist max-w-md mx-auto leading-relaxed">
              Les documents liés à votre projet apparaîtront ici dès qu'ils seront émis (devis,
              factures) ou partagés par MAPA Développement (contrats, livrables, comptes-rendus).
            </p>
          </div>
        ) : (
          filtered.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              busy={downloadingDocId === doc.id.replace('doc-', '')}
            />
          ))
        )}
      </div>

      <p className="px-5 py-3 text-[10px] font-mono text-ws-mist/60 leading-relaxed border-t border-ws-line/60 bg-ws-deep/20">
        Cliquez sur « Voir » pour ouvrir un document. Vous pouvez ensuite le télécharger en PDF
        depuis l'aperçu.
      </p>

      {previewHtml && (
        <DocumentPreviewOverlay
          html={previewHtml.html}
          filename={previewHtml.filename}
          onClose={() => setPreviewHtml(null)}
        />
      )}
    </section>
  );
}

function DocumentRow({ doc, busy }: { doc: UnifiedDoc; busy: boolean }) {
  const Icon = doc.kind === 'devis' ? FileSignature : doc.kind === 'upload' ? FolderOpen : Receipt;
  const iconCls =
    doc.kind === 'devis'
      ? 'bg-ws-accent/10 text-ws-accent border-ws-accent/30'
      : doc.kind === 'upload'
        ? 'bg-violet-500/10 text-violet-300 border-violet-500/30'
        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';

  return (
    <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-ws-raised/30 transition-colors group">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${iconCls}`}
      >
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-ws-paper truncate">{doc.title}</p>
          {doc.statusLabel && doc.statusTone && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-[0.15em] ${TONE_CLS[doc.statusTone]}`}
            >
              {doc.statusLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {doc.subtitle && (
            <span className="text-[11px] font-mono text-ws-mist truncate">{doc.subtitle}</span>
          )}
          <span className="text-[10px] font-mono text-ws-mist/70 flex items-center gap-1">
            <Calendar size={9} />
            {formatDateShort(doc.date)}
          </span>
        </div>
      </div>
      {doc.amount != null && (
        <span className="text-sm font-mono font-semibold tabular-nums text-ws-paper hidden sm:inline">
          {formatEur(doc.amount)}
        </span>
      )}
      <button
        type="button"
        onClick={doc.onView}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ws-accent/10 hover:bg-ws-accent/20 border border-ws-accent/30 text-ws-accent-soft text-xs font-mono uppercase tracking-[0.15em] transition-colors disabled:opacity-50"
      >
        {busy ? (
          <Loader2 size={12} className="animate-spin" />
        ) : doc.kind === 'upload' ? (
          <Download size={12} />
        ) : (
          <Eye size={12} />
        )}
        {busy ? '…' : doc.kind === 'upload' ? 'Télécharger' : 'Voir'}
      </button>
    </div>
  );
}

function DocumentPreviewOverlay({
  html,
  filename,
  onClose,
}: {
  html: string;
  filename: string;
  onClose: () => void;
}) {
  const handleDownload = async () => {
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename }),
      });
      if (!res.ok) throw new Error('API unavailable');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback : ouvre la boîte d'impression du navigateur
      const iframe = document.getElementById('doc-preview-iframe') as HTMLIFrameElement | null;
      iframe?.contentWindow?.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ws-line/60 bg-ws-panel/95 backdrop-blur flex-shrink-0">
        <span className="text-xs font-mono text-ws-ink uppercase tracking-widest truncate max-w-xs">
          {filename}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ws-accent/15 hover:bg-ws-accent/25 border border-ws-accent/40 text-ws-accent-soft text-xs font-mono"
          >
            <Download size={13} />
            Télécharger PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-ws-mist hover:text-ws-paper hover:bg-white/[0.06] transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <iframe
          id="doc-preview-iframe"
          srcDoc={html}
          title={filename}
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    </div>
  );
}

function labelizeCategory(c: string): string {
  return (
    {
      contrat: 'Contrat',
      livrable: 'Livrable',
      'compte-rendu': 'Compte-rendu',
      charte: 'Charte',
      autre: 'Autre',
    }[c] ?? 'Document'
  );
}
