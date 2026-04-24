import { Wallet, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import type { Invoice, Quote } from '../lib/types';
import { formatDateShort, formatEur } from '../lib/format';

interface FinanceCardProps {
  quotes: Quote[];
  invoices: Invoice[];
}

/**
 * Récapitulatif financier visible du client : devis accepté principal,
 * acompte / solde, factures (payées, en attente, en retard).
 */
export function FinanceCard({ quotes, invoices }: FinanceCardProps) {
  // Devis de référence : le plus récent signé, sinon envoyé, sinon brouillon
  const primaryQuote =
    quotes.find((q) => q.status === 'signed') ??
    quotes.find((q) => q.status === 'sent') ??
    quotes[0];

  const totalPaid = invoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.amount, 0);
  const totalPending = invoices
    .filter((i) => i.status === 'sent' || i.status === 'draft')
    .reduce((acc, i) => acc + i.amount, 0);
  const totalOverdue = invoices
    .filter((i) => i.status === 'overdue')
    .reduce((acc, i) => acc + i.amount, 0);

  if (!primaryQuote && invoices.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center gap-2">
        <Wallet size={15} className="text-ws-accent" />
        <h3 className="font-display text-base font-semibold text-ws-paper">Finances</h3>
      </div>

      <div className="p-5 space-y-5">
        {primaryQuote && (
          <div className="rounded-2xl border border-ws-line bg-ws-deep/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-ws-accent" />
                <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ws-mist">
                  Devis de référence
                </span>
              </div>
              <QuoteStatusBadge status={primaryQuote.status} />
            </div>
            <div className="font-display text-lg text-ws-paper font-semibold">
              {primaryQuote.title}
            </div>
            <div className="font-mono text-[11px] text-ws-mist mt-0.5">
              {primaryQuote.quote_number ?? 'Sans référence'} ·{' '}
              {formatDateShort(primaryQuote.created_at)}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <FinanceCell
                label="Montant total"
                value={formatEur(primaryQuote.amount)}
                accent="paper"
              />
              {primaryQuote.deposit_requested && primaryQuote.deposit_amount ? (
                <FinanceCell
                  label="Acompte"
                  value={formatEur(primaryQuote.deposit_amount)}
                  accent="gold"
                  sub={
                    primaryQuote.signed_at
                      ? 'Signé le ' + formatDateShort(primaryQuote.signed_at)
                      : 'À la commande'
                  }
                />
              ) : (
                <FinanceCell label="Acompte" value="—" accent="muted" />
              )}
              <FinanceCell
                label="Valide jusqu'au"
                value={formatDateShort(primaryQuote.valid_until)}
                accent="muted"
              />
            </div>
          </div>
        )}

        {/* Résumé factures */}
        <div className="grid grid-cols-3 gap-3">
          <InvoiceTotal
            icon={<CheckCircle2 size={14} />}
            label="Réglé"
            amount={totalPaid}
            color="emerald"
          />
          <InvoiceTotal
            icon={<Clock size={14} />}
            label="En attente"
            amount={totalPending}
            color="gold"
          />
          <InvoiceTotal
            icon={<AlertCircle size={14} />}
            label="En retard"
            amount={totalOverdue}
            color="red"
          />
        </div>

        {/* Liste factures (max 4) */}
        {invoices.length > 0 && (
          <ul className="divide-y divide-ws-line rounded-xl overflow-hidden border border-ws-line bg-ws-deep/20">
            {invoices.slice(0, 4).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-ws-paper truncate">
                    Facture {inv.invoice_number ?? '—'}
                  </div>
                  <div className="text-[11px] font-mono text-ws-mist">
                    {inv.paid_date
                      ? `Payée le ${formatDateShort(inv.paid_date)}`
                      : inv.due_date
                      ? `Échéance ${formatDateShort(inv.due_date)}`
                      : formatDateShort(inv.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <InvoiceStatusBadge status={inv.status} />
                  <div className="text-sm font-mono font-semibold text-ws-paper tabular-nums">
                    {formatEur(inv.amount)}
                  </div>
                </div>
              </li>
            ))}
            {invoices.length > 4 && (
              <li className="px-4 py-2 text-[11px] font-mono text-ws-mist text-center">
                + {invoices.length - 4} autre{invoices.length - 4 > 1 ? 's' : ''} facture
                {invoices.length - 4 > 1 ? 's' : ''}
              </li>
            )}
          </ul>
        )}

        <p className="text-[10px] font-mono text-ws-mist/60 leading-relaxed">
          Tous les montants sont exprimés <strong className="text-ws-mist">hors taxes</strong>.
          TVA non applicable, art. 293 B du CGI.
        </p>
      </div>
    </section>
  );
}

function FinanceCell({
  label,
  value,
  sub,
  accent = 'paper',
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'paper' | 'gold' | 'muted';
}) {
  const colors = {
    paper: 'text-ws-paper',
    gold: 'text-ws-accent',
    muted: 'text-ws-ink',
  } as const;
  return (
    <div className="rounded-lg bg-ws-panel/80 border border-ws-line px-3 py-2.5">
      <div className="text-[9px] font-mono uppercase tracking-[0.2em] text-ws-mist mb-1">
        {label}
      </div>
      <div className={`text-sm font-mono font-semibold tabular-nums ${colors[accent]}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] font-mono text-ws-mist mt-0.5">{sub}</div>}
    </div>
  );
}

function InvoiceTotal({
  icon,
  label,
  amount,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  color: 'emerald' | 'gold' | 'red';
}) {
  const styles = {
    emerald: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/5',
    gold: 'text-ws-accent border-ws-accent/30 bg-ws-accent/5',
    red: 'text-red-300 border-red-500/25 bg-red-500/5',
  } as const;
  return (
    <div className={`rounded-xl border px-3 py-3 ${styles[color]}`}>
      <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.2em] opacity-80">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-mono font-semibold mt-1 tabular-nums">{formatEur(amount)}</div>
    </div>
  );
}

function QuoteStatusBadge({ status }: { status: Quote['status'] }) {
  const map: Record<Quote['status'], { label: string; cls: string }> = {
    draft: { label: 'Brouillon', cls: 'bg-ws-deep/40 text-ws-mist border-ws-line' },
    sent: { label: 'Envoyé', cls: 'bg-ws-accent/15 text-ws-accent border-ws-accent/35' },
    signed: {
      label: 'Signé',
      cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    refused: { label: 'Refusé', cls: 'bg-red-500/10 text-red-300 border-red-500/30' },
    expired: { label: 'Expiré', cls: 'bg-ws-deep/40 text-ws-mist border-ws-line' },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.18em] border ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const map: Record<Invoice['status'], { label: string; cls: string }> = {
    draft: { label: 'Brouillon', cls: 'bg-ws-deep/40 text-ws-mist border-ws-line' },
    sent: { label: 'Envoyée', cls: 'bg-ws-accent/15 text-ws-accent border-ws-accent/30' },
    paid: {
      label: 'Réglée',
      cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    overdue: { label: 'En retard', cls: 'bg-red-500/10 text-red-300 border-red-500/30' },
    cancelled: { label: 'Annulée', cls: 'bg-ws-deep/40 text-ws-mist border-ws-line' },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-[0.18em] border ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
