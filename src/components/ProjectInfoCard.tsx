import { Calendar, ExternalLink, Tag, Hourglass } from 'lucide-react';
import type { ProjectSummary } from '../lib/types';
import { ProjectStatusBadge } from './StatusBadge';
import { daysBetween, formatDateLong, projectTypeLabel } from '../lib/format';

interface ProjectInfoCardProps {
  project: ProjectSummary;
  progress: number;
  currentStepTitle?: string;
}

export function ProjectInfoCard({ project, progress, currentStepTitle }: ProjectInfoCardProps) {
  const today = new Date();
  const start = project.start_date ? new Date(project.start_date) : null;
  const end = project.end_date ? new Date(project.end_date) : null;
  const elapsed = start ? Math.max(0, daysBetween(start, today)) : null;
  const remaining = end ? daysBetween(today, end) : null;

  return (
    <section className="rounded-3xl border border-ws-line bg-gradient-to-b from-ws-panel/80 to-ws-panel/40 p-6 md:p-8 relative overflow-hidden">
      <div
        className="absolute -top-24 -right-20 w-72 h-72 rounded-full pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(175,112,55,0.22) 0%, transparent 70%)',
        }}
      />
      <div className="relative">
        <div className="flex items-center flex-wrap gap-3 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-ws-accent">
            Votre projet
          </span>
          <ProjectStatusBadge status={project.status} />
          {project.type && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-ws-mist border border-ws-line px-2.5 py-0.5 rounded-full">
              <Tag size={10} />
              {projectTypeLabel(project.type)}
            </span>
          )}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-light text-ws-paper leading-tight">
          {project.name}
        </h1>
        {project.description && (
          <p className="text-sm md:text-base text-ws-ink mt-3 leading-relaxed max-w-3xl">
            {project.description}
          </p>
        )}

        {/* Progression */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-ws-mist">
              Avancement
            </span>
            <span className="text-sm font-mono text-ws-accent font-semibold tabular-nums">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-ws-deep/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ws-accent-muted to-ws-accent transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Infos clés — grille 4 */}
        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCell
            icon={<Calendar size={12} />}
            label="Démarrage"
            value={formatDateLong(project.start_date)}
            sub={elapsed != null ? `il y a ${elapsed} j` : undefined}
          />
          <InfoCell
            icon={<Calendar size={12} />}
            label="Livraison estimée"
            value={formatDateLong(project.end_date)}
            sub={
              remaining != null
                ? remaining > 0
                  ? `dans ${remaining} j`
                  : remaining === 0
                  ? "aujourd'hui"
                  : `dépassée de ${Math.abs(remaining)} j`
                : undefined
            }
            accent={remaining != null && remaining < 0}
          />
          <InfoCell
            icon={<Hourglass size={12} />}
            label="Étape en cours"
            value={currentStepTitle || '—'}
          />
          <InfoCell
            icon={<ExternalLink size={12} />}
            label="Site livré"
            value={project.site_url ? 'Accessible' : 'À venir'}
            link={project.site_url ?? undefined}
          />
        </div>
      </div>
    </section>
  );
}

interface InfoCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  link?: string;
  accent?: boolean;
}

function InfoCell({ icon, label, value, sub, link, accent }: InfoCellProps) {
  const content = (
    <div
      className={`rounded-xl bg-ws-deep/40 border border-ws-line px-3.5 py-3 ${
        link ? 'hover:border-ws-accent/40 transition-colors cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.2em] text-ws-mist mb-1.5">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`text-sm truncate ${
          accent ? 'text-red-300' : 'text-ws-paper'
        } ${link ? 'font-semibold' : ''}`}
      >
        {value}
      </div>
      {sub && <div className="text-[10px] font-mono text-ws-mist mt-0.5">{sub}</div>}
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}
