import { LogOut, Loader2, Mail } from 'lucide-react';
import { useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useProjectData } from '../hooks/useProjectData';
import { ProjectTimeline } from '../components/ProjectTimeline';
import { MessageThread } from '../components/MessageThread';
import { ProjectInfoCard } from '../components/ProjectInfoCard';
import { FinanceCard } from '../components/FinanceCard';
import { UpcomingEvents } from '../components/UpcomingEvents';
import { ChecklistPreview } from '../components/ChecklistPreview';
import { TeamContact } from '../components/TeamContact';

export function ProjectPage({ session }: { session: Session }) {
  const userId = session.user.id;
  const {
    loading,
    error,
    portalUser,
    project,
    steps,
    messages,
    quotes,
    invoices,
    events,
    checklist,
    sendMessage,
  } = useProjectData(userId);

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
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
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

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 md:px-8 py-8 md:py-12">
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
              href="mailto:contact@mapa-developpement.fr"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ws-accent text-ws-void text-sm font-semibold hover:brightness-110 transition-all"
            >
              <Mail size={14} />
              Contacter MAPA Développement
            </a>
          </div>
        ) : project ? (
          <div className="space-y-8 md:space-y-10">
            {/* Bandeau projet enrichi avec dates + étape + lien site */}
            <ProjectInfoCard
              project={project}
              progress={progress}
              currentStepTitle={currentStep?.title}
            />

            {/* Ligne principale : timeline (2/3) + messagerie (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              <div className="lg:col-span-3 space-y-8">
                <div>
                  <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                    Avancement détaillé
                  </h2>
                  <ProjectTimeline steps={steps} />
                </div>

                <div>
                  <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                    Récapitulatif financier
                  </h2>
                  <FinanceCard quotes={quotes} invoices={invoices} />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                    Communication
                  </h2>
                  <MessageThread messages={messages} onSend={sendMessage} />
                </div>

                <UpcomingEvents events={events} />

                <ChecklistPreview items={checklist} />

                <TeamContact />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-ws-line py-6 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-ws-mist">
          © MAPA Développement · contact@mapa-developpement.fr
        </p>
      </footer>
    </div>
  );
}
