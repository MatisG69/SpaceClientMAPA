import { LogOut, Loader2, Mail, ExternalLink } from 'lucide-react';
import { useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useProjectData } from '../hooks/useProjectData';
import { ProjectTimeline } from '../components/ProjectTimeline';
import { MessageThread } from '../components/MessageThread';
import { ProjectStatusBadge } from '../components/StatusBadge';

export function ProjectPage({ session }: { session: Session }) {
  const userId = session.user.id;
  const { loading, error, portalUser, project, steps, messages, sendMessage } = useProjectData(userId);

  const progress = useMemo(() => {
    if (!project) return 0;
    if (steps.length === 0) return project.progress ?? 0;
    const done = steps.filter((s) => s.status === 'done').length;
    return Math.round((done / steps.length) * 100);
  }, [project, steps]);

  const currentStep = useMemo(() => steps.find((s) => s.status === 'in_progress'), [steps]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-30 backdrop-blur-lg bg-ws-void/80 border-b border-ws-line">
        <div className="max-w-5xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="MAPA" className="h-8 w-auto" />
            <div className="h-6 w-px bg-ws-line hidden md:block" />
            <div className="hidden md:block">
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-ws-mist">
                Espace client
              </div>
              <div className="text-sm text-ws-paper font-semibold truncate max-w-[280px]">
                {portalUser?.name || portalUser?.email || '—'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-[0.18em] text-ws-mist hover:text-ws-paper hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 md:px-8 py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center gap-3 text-ws-mist py-24">
            <Loader2 size={16} className="animate-spin" />
            <span className="font-mono text-sm">Chargement de votre projet…</span>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-ws-line bg-ws-panel/70 p-10 text-center max-w-xl mx-auto">
            <h2 className="font-display text-xl font-semibold text-ws-paper mb-3">
              Projet indisponible
            </h2>
            <p className="text-sm text-ws-mist mb-6 leading-relaxed">{error}</p>
            <a
              href="mailto:contact@mapa-dev.fr"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ws-accent text-ws-void text-sm font-semibold hover:brightness-110 transition-all"
            >
              <Mail size={14} />
              Contacter MAPA Développement
            </a>
          </div>
        ) : project ? (
          <div className="space-y-8 md:space-y-10">
            {/* Bandeau projet */}
            <section className="rounded-3xl border border-ws-line bg-gradient-to-b from-ws-panel/80 to-ws-panel/40 p-6 md:p-8 relative overflow-hidden">
              <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none opacity-50"
                style={{
                  background:
                    'radial-gradient(circle, rgba(175,112,55,0.22) 0%, transparent 70%)',
                }}
              />
              <div className="relative">
                <div className="flex items-center flex-wrap gap-3 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-ws-accent">
                    Votre projet
                  </span>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-light text-ws-paper leading-tight">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-sm md:text-base text-ws-ink mt-3 leading-relaxed max-w-2xl">
                    {project.description}
                  </p>
                )}

                {/* Progression */}
                <div className="mt-7 flex items-center gap-4">
                  <div className="flex-1 h-1.5 rounded-full bg-ws-deep/60 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ws-accent-muted to-ws-accent transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-ws-accent font-semibold tabular-nums">
                    {progress}%
                  </span>
                </div>

                {/* Étape courante + lien site */}
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono">
                  {currentStep && (
                    <span className="text-ws-mist">
                      <span className="text-ws-accent">Étape en cours :</span> {currentStep.title}
                    </span>
                  )}
                  {project.site_url && (
                    <a
                      href={project.site_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-ws-ink hover:text-ws-accent transition-colors"
                    >
                      <ExternalLink size={12} />
                      Aperçu du site
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Grid desktop : timeline + messages côte à côte */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              <div className="lg:col-span-3">
                <h2 className="font-display text-sm font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em] text-[11px] font-mono">
                  Avancement
                </h2>
                <ProjectTimeline steps={steps} />
              </div>
              <div className="lg:col-span-2">
                <h2 className="font-display text-sm font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em] text-[11px] font-mono">
                  Communication
                </h2>
                <MessageThread messages={messages} onSend={sendMessage} />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-ws-line py-6 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-ws-mist">
          © MAPA Développement · contact@mapa-dev.fr
        </p>
      </footer>
    </div>
  );
}
