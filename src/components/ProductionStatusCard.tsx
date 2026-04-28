import {
  Globe,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Wrench,
  AlertCircle,
  Gauge,
  Calendar,
  Github,
  Server,
  Activity,
} from 'lucide-react';
import { useProjectProduction } from '../hooks/useProjectProduction';
import type { UptimeStatus } from '../lib/types';
import { formatDateLong, formatDateTime } from '../lib/format';

interface ProductionStatusCardProps {
  projectId: string;
}

const UPTIME_TONES: Record<UptimeStatus, { bg: string; text: string; label: string; icon: JSX.Element }> = {
  up: {
    bg: 'bg-emerald-500/15 border-emerald-500/40',
    text: 'text-emerald-300',
    label: 'En ligne',
    icon: <CheckCircle2 size={11} />,
  },
  down: {
    bg: 'bg-red-500/15 border-red-500/40',
    text: 'text-red-300',
    label: 'Hors ligne',
    icon: <XCircle size={11} />,
  },
  maintenance: {
    bg: 'bg-amber-500/15 border-amber-500/40',
    text: 'text-amber-300',
    label: 'Maintenance',
    icon: <Wrench size={11} />,
  },
  unknown: {
    bg: 'bg-ws-deep/40 border-ws-line',
    text: 'text-ws-mist',
    label: 'Statut inconnu',
    icon: <AlertCircle size={11} />,
  },
};

function scoreTone(score: number | null): { bar: string; text: string } {
  if (score == null) return { bar: 'bg-ws-line', text: 'text-ws-mist' };
  if (score >= 90) return { bar: 'bg-emerald-400', text: 'text-emerald-300' };
  if (score >= 50) return { bar: 'bg-amber-400', text: 'text-amber-300' };
  return { bar: 'bg-red-400', text: 'text-red-300' };
}

export function ProductionStatusCard({ projectId }: ProductionStatusCardProps) {
  const { data, loading } = useProjectProduction(projectId);

  if (loading || !data) return null;

  const hasContent =
    data.prod_url ||
    data.launch_date ||
    data.lighthouse_performance != null ||
    data.lighthouse_accessibility != null ||
    data.lighthouse_seo != null ||
    data.lighthouse_best_practices != null ||
    data.repo_url;

  if (!hasContent) return null;

  const tone = UPTIME_TONES[data.uptime_status];
  const hasScores =
    data.lighthouse_performance != null ||
    data.lighthouse_accessibility != null ||
    data.lighthouse_seo != null ||
    data.lighthouse_best_practices != null;
  const hasCwv =
    data.cwv_lcp_seconds != null || data.cwv_cls != null || data.cwv_inp_ms != null;

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <header className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Globe size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">
            Site en production
          </h3>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-[0.18em] ${tone.bg} ${tone.text}`}
          >
            {tone.icon}
            {tone.label}
          </span>
        </div>
        {data.uptime_checked_at && (
          <span className="text-[10px] font-mono text-ws-mist flex items-center gap-1">
            <Activity size={10} />
            Vérifié {formatDateTime(data.uptime_checked_at)}
          </span>
        )}
      </header>

      <div className="p-5 space-y-5">
        {/* Liens prod/repo/cms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.prod_url && (
            <LinkCard
              icon={<Globe size={13} />}
              label="URL de production"
              href={data.prod_url}
              displayHref={data.prod_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              accent
            />
          )}
          {data.cms_url && (
            <LinkCard
              icon={<ExternalLink size={13} />}
              label="Back-office / CMS"
              href={data.cms_url}
              displayHref={data.cms_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            />
          )}
          {data.repo_url && (
            <LinkCard
              icon={<Github size={13} />}
              label="Code source"
              href={data.repo_url}
              displayHref={data.repo_url.replace(/^https?:\/\/(www\.)?/, '')}
            />
          )}
          {data.hosting_provider && (
            <div className="rounded-2xl border border-ws-line bg-ws-deep/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1 inline-flex items-center gap-1.5">
                <Server size={10} />
                Hébergeur
              </div>
              <p className="text-sm text-ws-paper font-medium">{data.hosting_provider}</p>
            </div>
          )}
          {data.launch_date && (
            <div className="rounded-2xl border border-ws-line bg-ws-deep/30 px-4 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1 inline-flex items-center gap-1.5">
                <Calendar size={10} />
                Mise en ligne
              </div>
              <p className="text-sm text-ws-paper font-medium">{formatDateLong(data.launch_date)}</p>
            </div>
          )}
        </div>

        {/* Lighthouse scores */}
        {hasScores && (
          <div className="rounded-2xl border border-ws-line bg-ws-deep/20 p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Gauge size={13} className="text-ws-accent" />
              <h4 className="font-display text-sm font-semibold text-ws-paper">
                Performance
              </h4>
              {data.lighthouse_checked_at && (
                <span className="text-[10px] font-mono text-ws-mist">
                  · mesuré {formatDateLong(data.lighthouse_checked_at)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScoreTile label="Performance" value={data.lighthouse_performance} />
              <ScoreTile label="Accessibilité" value={data.lighthouse_accessibility} />
              <ScoreTile label="SEO" value={data.lighthouse_seo} />
              <ScoreTile label="Best practices" value={data.lighthouse_best_practices} />
            </div>
            {hasCwv && (
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-ws-line/60">
                <CwvTile label="LCP" value={data.cwv_lcp_seconds} unit="s" good={2.5} poor={4.0} />
                <CwvTile label="CLS" value={data.cwv_cls} unit="" good={0.1} poor={0.25} digits={3} />
                <CwvTile label="INP" value={data.cwv_inp_ms} unit="ms" good={200} poor={500} digits={0} />
              </div>
            )}
            {data.lighthouse_report_url && (
              <a
                href={data.lighthouse_report_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-ws-accent hover:underline"
              >
                <ExternalLink size={11} />
                Voir le rapport complet
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function LinkCard({
  icon,
  label,
  href,
  displayHref,
  accent,
}: {
  icon: JSX.Element;
  label: string;
  href: string;
  displayHref: string;
  accent?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group rounded-2xl border px-4 py-3 transition-colors ${
        accent
          ? 'border-ws-accent/40 bg-ws-accent/[0.06] hover:border-ws-accent/70'
          : 'border-ws-line bg-ws-deep/30 hover:border-ws-accent/30'
      }`}
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1 inline-flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      <p className="text-sm text-ws-paper font-medium truncate flex items-center gap-1.5">
        {displayHref}
        <ExternalLink size={11} className="opacity-50 group-hover:opacity-100 transition-opacity" />
      </p>
    </a>
  );
}

function ScoreTile({ label, value }: { label: string; value: number | null }) {
  const tone = scoreTone(value);
  return (
    <div className="rounded-xl border border-ws-line bg-ws-deep/30 px-3 py-3">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-1">
        {label}
      </p>
      <p className={`text-2xl font-mono font-bold tabular-nums ${tone.text}`}>
        {value ?? '—'}
        <span className="text-xs text-ws-mist ml-1">/100</span>
      </p>
      <div className="mt-2 h-1 w-full rounded-full bg-ws-line overflow-hidden">
        <div
          className={`h-full ${tone.bar} transition-all`}
          style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
        />
      </div>
    </div>
  );
}

function CwvTile({
  label,
  value,
  unit,
  good,
  poor,
  digits = 2,
}: {
  label: string;
  value: number | null;
  unit: string;
  good: number;
  poor: number;
  digits?: number;
}) {
  const tone =
    value == null
      ? 'text-ws-mist'
      : value <= good
        ? 'text-emerald-300'
        : value <= poor
          ? 'text-amber-300'
          : 'text-red-300';
  return (
    <div className="rounded-xl border border-ws-line bg-ws-deep/20 px-3 py-2.5">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ws-mist mb-0.5">
        {label}
      </p>
      <p className={`text-base font-mono font-bold tabular-nums ${tone}`}>
        {value == null ? '—' : value.toFixed(digits)}
        {value != null && unit && <span className="text-xs text-ws-mist ml-1">{unit}</span>}
      </p>
    </div>
  );
}
