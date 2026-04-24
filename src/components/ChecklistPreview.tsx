import { ListChecks } from 'lucide-react';
import type { ChecklistItem } from '../lib/types';

export function ChecklistPreview({ items }: { items: ChecklistItem[] }) {
  if (items.length === 0) return null;

  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">Points de contrôle</h3>
        </div>
        <span className="text-[11px] font-mono text-ws-mist">
          {done}/{items.length} · {pct}%
        </span>
      </div>

      <ul className="divide-y divide-ws-line max-h-80 overflow-y-auto scrollbar-mapa">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 px-5 py-3 hover:bg-ws-raised/20 transition-colors"
          >
            <div
              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                item.done
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'border-ws-line bg-ws-deep/30'
              }`}
            >
              {item.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                  <path
                    d="M1 4l3 3 5-6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span
              className={`text-sm leading-relaxed ${
                item.done ? 'text-ws-mist line-through' : 'text-ws-paper'
              }`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
