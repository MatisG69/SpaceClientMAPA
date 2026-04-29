import { LogOut, Loader2, Mail, FolderKanban } from 'lucide-react';
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
import { DocumentsSection } from '../components/DocumentsSection';
import { ProjectBriefViewer } from '../components/ProjectBriefViewer';
import { RequestedResourcesSection } from '../components/RequestedResourcesSection';
import { ClientCollaborationSection } from '../components/ClientCollaborationSection';
import { ProductionStatusCard } from '../components/ProductionStatusCard';
import { ClientExtrasSection } from '../components/ClientExtrasSection';
import { BookingSection } from '../components/BookingSection';
import type { Project } from '../lib/types';

export function ProjectPage({ session }: { session: Session }) {
  const userId = session.user.id;
  const {
    loading,
    error,
    portalUser,
    client,
    projects,
    selectedProject,
    selectedProjectId,
    selectProject,
    steps,
    messages,
    quotes,
    invoices,
    events,
    checklist,
    documents,
    sendMessage,
    refetch,
  } = useProjectData(userId);

  const progress = useMemo(() => {
    if (!selectedProject) return 0;
    if (steps.length === 0) return selectedProject.progress ?? 0;
    const done = steps.filter((s) => s.status === 'done').length;
    return Math.round((done / steps.length) * 100);
  }, [selectedProject, steps]);

  const currentStep = useMemo(() => steps.find((s) => s.status === 'in_progress'), [steps]);

  // Quotes/invoices propres au projet sélectionné — utilisés pour la fiche projet
  const projectQuotes = useMemo(
    () => quotes.filter((q) => !q.project_id || q.project_id === selectedProjectId),
    [quotes, selectedProjectId]
  );
  const projectInvoices = useMemo(
    () => invoices.filter((i) => !i.project_id || i.project_id === selectedProjectId),
    [invoices, selectedProjectId]
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-full flex flex-col">
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
              Espace indisponible
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
        ) : projects.length === 0 ? (
          <div className="rounded-3xl border border-ws-line bg-ws-panel/70 p-10 text-center max-w-xl mx-auto">
            <FolderKanban size={28} className="mx-auto mb-3 text-ws-mist/60" />
            <h2 className="font-display text-xl font-semibold text-ws-paper mb-2">
              Bientôt disponible
            </h2>
            <p className="text-sm text-ws-mist leading-relaxed">
              Aucun projet n'est encore rattaché à votre compte. Vos prestations apparaîtront ici
              dès leur démarrage.
            </p>
          </div>
        ) : selectedProject ? (
          <div className="space-y-8 md:space-y-10">
            {/* Sélecteur de projet (visible si > 1 projet pour ce client) */}
            {projects.length > 1 && (
              <div className="rounded-2xl border border-ws-line bg-ws-panel/60 p-4 md:p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ws-mist mb-1">
                      Vos projets ({projects.length})
                    </div>
                    <div className="text-xs text-ws-ink">
                      Sélectionnez un projet pour consulter son avancement détaillé.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => void selectProject(p.id)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono transition-all ${
                          p.id === selectedProjectId
                            ? 'bg-ws-accent/15 border-ws-accent/45 text-ws-paper shadow-glow-sm'
                            : 'bg-ws-deep/40 border-ws-line text-ws-mist hover:text-ws-paper hover:border-ws-accent/30'
                        }`}
                      >
                        <FolderKanban size={12} />
                        <span className="truncate max-w-[180px]">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <ProjectInfoCard
              project={selectedProject}
              progress={progress}
              currentStepTitle={currentStep?.title}
            />

            <ProductionStatusCard projectId={selectedProject.id} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
              <div className="lg:col-span-3 space-y-8">
                <div>
                  <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                    Brief &amp; spécifications
                  </h2>
                  <ProjectBriefViewer
                    projectId={selectedProject.id}
                    defaultSignature={portalUser?.name ?? client?.name ?? ''}
                  />
                </div>

                <div>
                  <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                    Documents demandés
                  </h2>
                  <RequestedResourcesSection documents={documents} onRefresh={refetch} />
                </div>

                <div>
                  <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                    Avancement détaillé
                  </h2>
                  <ProjectTimeline
                    steps={steps}
                    defaultSignature={portalUser?.name ?? client?.name ?? ''}
                    onRefresh={refetch}
                  />
                </div>

                {client && (
                  <div>
                    <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                      Collaboration projet
                    </h2>
                    <ClientCollaborationSection
                      projectId={selectedProject.id}
                      clientId={client.id}
                      defaultSignature={portalUser?.name ?? client.name ?? ''}
                    />
                  </div>
                )}

                {client && (
                  <div>
                    <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                      Confidentialité, idées &amp; témoignage
                    </h2>
                    <ClientExtrasSection
                      projectId={selectedProject.id}
                      clientId={client.id}
                      defaultSignature={portalUser?.name ?? client.name ?? ''}
                    />
                  </div>
                )}

                <div>
                  <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                    Récapitulatif financier
                  </h2>
                  <FinanceCard quotes={projectQuotes} invoices={projectInvoices} />
                </div>

                <div>
                  <h2 className="font-display text-[11px] font-mono font-semibold text-ws-paper mb-4 uppercase tracking-[0.2em]">
                    Documents
                  </h2>
                  <DocumentsSection
                    client={client}
                    projects={projects as unknown as Project[]}
                    quotes={quotes}
                    invoices={invoices}
                    documents={documents}
                  />
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

                <BookingSection
                  clientId={client?.id ?? null}
                  portalUserId={portalUser?.id ?? null}
                  clientLabel={client?.company || client?.name || portalUser?.name || 'Client'}
                  onBooked={refetch}
                />

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
