import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import type { PortalMessage } from '../lib/types';

interface MessageThreadProps {
  messages: PortalMessage[];
  onSend: (content: string) => Promise<void>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MessageThread({ messages, onSend }: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setError(null);
    setSending(true);
    try {
      await onSend(trimmed);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-ws-line bg-ws-deep/30">
        <h3 className="font-display text-base font-semibold text-ws-paper">Vos questions</h3>
        <p className="text-xs text-ws-mist mt-1">
          Posez vos questions ici. MAPA Développement vous répond directement dans ce fil.
        </p>
      </div>

      <div className="max-h-[480px] overflow-y-auto scrollbar-mapa px-5 py-5 bg-ws-deep/10">
        {messages.length === 0 ? (
          <p className="text-sm text-ws-mist text-center py-10">
            Aucun message pour l'instant. Posez votre première question ci-dessous.
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const isClient = m.sender === 'client';
              return (
                <li
                  key={m.id}
                  className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      isClient
                        ? 'bg-ws-accent text-ws-void rounded-br-sm'
                        : 'bg-ws-panel border border-ws-line text-ws-paper rounded-bl-sm'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-mono uppercase tracking-[0.22em] mb-1 ${
                        isClient ? 'text-ws-void/60' : 'text-ws-accent'
                      }`}
                    >
                      {isClient ? 'Vous' : 'MAPA Développement'}
                      <span
                        className={`ml-2 normal-case tracking-normal ${
                          isClient ? 'text-ws-void/60' : 'text-ws-mist'
                        }`}
                      >
                        {formatTime(m.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-ws-line p-4 bg-ws-deep/30 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSubmit(e as unknown as React.FormEvent);
            }
          }}
          rows={3}
          placeholder="Votre question, une demande d'ajustement, un retour…"
          className="w-full px-4 py-3 rounded-xl bg-ws-panel border border-ws-line text-ws-paper placeholder:text-ws-mist/60 text-sm focus:outline-none focus:border-ws-accent resize-none"
        />
        {error && <p className="text-xs text-red-300">{error}</p>}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-mono text-ws-mist tracking-[0.18em]">
            ⌘+Entrée pour envoyer
          </p>
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-ws-accent-soft to-ws-accent text-ws-void text-sm font-semibold hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-sm"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}
