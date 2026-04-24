import { Mail, Phone, HeartHandshake } from 'lucide-react';

export function TeamContact() {
  return (
    <section className="rounded-3xl border border-ws-accent/25 bg-gradient-to-br from-ws-accent/[0.05] via-ws-panel/60 to-ws-panel/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center gap-2">
        <HeartHandshake size={15} className="text-ws-accent" />
        <h3 className="font-display text-base font-semibold text-ws-paper">Votre équipe</h3>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-ws-accent-soft to-ws-accent-muted flex items-center justify-center text-ws-void font-serif font-bold text-lg">
              M
            </div>
            <div>
              <div className="text-sm font-semibold text-ws-paper">Matis Gouyet</div>
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-ws-mist">
                Fondateur · Interlocuteur principal
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <a
            href="mailto:contact@mapa-developpement.fr"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ws-deep/40 border border-ws-line hover:border-ws-accent/40 transition-colors group"
          >
            <Mail size={14} className="text-ws-accent flex-shrink-0" />
            <span className="text-sm text-ws-paper group-hover:text-ws-accent truncate">
              contact@mapa-developpement.fr
            </span>
          </a>
          <a
            href="tel:+33679623942"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ws-deep/40 border border-ws-line hover:border-ws-accent/40 transition-colors group"
          >
            <Phone size={14} className="text-ws-accent flex-shrink-0" />
            <span className="text-sm text-ws-paper group-hover:text-ws-accent font-mono">
              +33 6 79 62 39 42
            </span>
          </a>
        </div>

        <p className="text-[11px] text-ws-mist leading-relaxed">
          Réponse garantie sous <strong className="text-ws-ink">24 h ouvrées</strong>. Pour toute
          demande urgente liée au projet, utilisez la messagerie intégrée ci-contre.
        </p>
      </div>
    </section>
  );
}
