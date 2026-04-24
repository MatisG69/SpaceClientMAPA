import { CalendarClock } from 'lucide-react';
import type { CalendarEvent } from '../lib/types';
import { formatDateTime } from '../lib/format';

export function UpcomingEvents({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) return null;

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center gap-2">
        <CalendarClock size={15} className="text-ws-accent" />
        <h3 className="font-display text-base font-semibold text-ws-paper">
          Prochains rendez-vous
        </h3>
      </div>

      <ul className="divide-y divide-ws-line">
        {events.map((ev) => (
          <li key={ev.id} className="px-5 py-4 flex items-start gap-4 hover:bg-ws-raised/30 transition-colors">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-ws-accent/15 border border-ws-accent/30 flex flex-col items-center justify-center text-ws-accent">
              <div className="text-[9px] font-mono uppercase tracking-[0.2em]">
                {new Date(ev.start_at).toLocaleDateString('fr-FR', { month: 'short' })}
              </div>
              <div className="text-lg font-semibold leading-none mt-0.5">
                {new Date(ev.start_at).getDate()}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ws-paper">{ev.title}</div>
              <div className="text-[11px] font-mono text-ws-mist mt-0.5">
                {formatDateTime(ev.start_at)}
                {ev.end_at && !ev.all_day && ` → ${new Date(ev.end_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                {ev.all_day && ' · Journée'}
              </div>
              {ev.description && (
                <p className="text-xs text-ws-ink mt-2 leading-relaxed">{ev.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
