import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useAvailability } from '../hooks/useAvailability';
import type { BookingSlot } from '../lib/types';

interface BookingSectionProps {
  clientId: string | null;
  portalUserId: string | null;
  /** Nom client/société pour pré-remplir le titre de l'event. */
  clientLabel: string;
  /** Callback à appeler après confirmation pour rafraîchir la liste des events. */
  onBooked?: () => void;
}

const DAYS_PER_PAGE = 7;
const WEEKDAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function BookingSection({ clientId, portalUserId, clientLabel, onBooked }: BookingSectionProps) {
  const { loading, error, hasAvailability, availableDays, getSlotsForDay, bookSlot } =
    useAvailability(clientId, portalUserId);

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = useState<BookingSlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<BookingSlot | null>(null);
  const [bookingTitle, setBookingTitle] = useState('');
  const [bookingNote, setBookingNote] = useState('');

  // Sélection auto du premier jour disponible
  useEffect(() => {
    if (!selectedDay && availableDays.length > 0) setSelectedDay(availableDays[0]);
  }, [availableDays, selectedDay]);

  const visibleDays = useMemo(() => {
    return availableDays.slice(pageIndex * DAYS_PER_PAGE, (pageIndex + 1) * DAYS_PER_PAGE);
  }, [availableDays, pageIndex]);

  const totalPages = Math.max(1, Math.ceil(availableDays.length / DAYS_PER_PAGE));

  const slotsToday = useMemo(() => {
    if (!selectedDay) return [];
    return getSlotsForDay(selectedDay);
  }, [selectedDay, getSlotsForDay]);

  const openConfirmation = (slot: BookingSlot) => {
    setPendingSlot(slot);
    setBookingTitle(`Rendez-vous - ${clientLabel}`);
    setBookingNote('');
    setSubmitError(null);
  };

  const closeModal = () => {
    if (submitting) return;
    setPendingSlot(null);
    setSubmitError(null);
  };

  const handleConfirm = async () => {
    if (!pendingSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await bookSlot(pendingSlot, bookingTitle.trim() || `Rendez-vous - ${clientLabel}`, bookingNote.trim() || undefined);
      setConfirmation(pendingSlot);
      setPendingSlot(null);
      onBooked?.();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center gap-2">
          <CalendarPlus size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">Réserver un rendez-vous</h3>
        </div>
        <div className="px-5 py-8 flex items-center justify-center text-ws-mist">
          <Loader2 size={18} className="animate-spin" />
        </div>
      </section>
    );
  }

  if (error || !hasAvailability) {
    return null;
  }

  if (availableDays.length === 0) {
    return (
      <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center gap-2">
          <CalendarPlus size={15} className="text-ws-accent" />
          <h3 className="font-display text-base font-semibold text-ws-paper">Réserver un rendez-vous</h3>
        </div>
        <div className="px-5 py-6 text-sm text-ws-mist">
          Aucun créneau disponible sur les 14 prochains jours. Merci de revenir plus tard.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-3xl border border-ws-line bg-ws-panel/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-ws-line bg-ws-deep/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarPlus size={15} className="text-ws-accent" />
            <h3 className="font-display text-base font-semibold text-ws-paper">Réserver un rendez-vous</h3>
          </div>
          {confirmation && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.18em] border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
              <Check size={11} /> Confirmé
            </span>
          )}
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Sélecteur de jour : pagination par semaines de 7 jours */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="p-1.5 rounded-lg border border-ws-line text-ws-mist hover:text-ws-paper hover:border-ws-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Semaine précédente"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex-1 grid grid-cols-7 gap-1.5">
              {visibleDays.map((day) => {
                const d = new Date(`${day}T00:00:00`);
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border text-center transition-colors ${
                      isSelected
                        ? 'bg-ws-accent/15 border-ws-accent/40 text-ws-accent'
                        : 'bg-ws-deep/30 border-ws-line text-ws-paper hover:border-ws-accent/30'
                    }`}
                  >
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-ws-mist">
                      {WEEKDAY_LABELS[d.getDay()]}
                    </span>
                    <span className="text-base font-semibold leading-none mt-1">{d.getDate()}</span>
                    <span className="text-[9px] font-mono uppercase tracking-[0.18em] text-ws-mist mt-0.5">
                      {d.toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
              {/* Padding pour conserver la grille à 7 colonnes en fin de liste */}
              {Array.from({ length: DAYS_PER_PAGE - visibleDays.length }).map((_, i) => (
                <div key={`pad-${i}`} className="rounded-xl border border-transparent" />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={pageIndex >= totalPages - 1}
              className="p-1.5 rounded-lg border border-ws-line text-ws-mist hover:text-ws-paper hover:border-ws-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Semaine suivante"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Grille de slots du jour sélectionné */}
          {selectedDay && (
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-ws-mist mb-2">
                {formatLongDate(selectedDay)}
              </div>
              {slotsToday.length === 0 ? (
                <div className="text-sm text-ws-mist py-4 text-center">
                  Aucun créneau libre ce jour-là.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slotsToday.map((slot) => (
                    <button
                      key={slot.start_at}
                      type="button"
                      onClick={() => openConfirmation(slot)}
                      className="px-3 py-2 rounded-lg border border-ws-line bg-ws-deep/30 text-ws-paper text-sm font-mono hover:border-ws-accent/50 hover:bg-ws-accent/10 transition-colors"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modale de confirmation */}
      {pendingSlot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ws-void/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-ws-line bg-ws-panel shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-ws-line flex items-center justify-between">
              <h4 className="font-display text-base font-semibold text-ws-paper">Confirmer le rendez-vous</h4>
              <button
                type="button"
                onClick={closeModal}
                className="text-ws-mist hover:text-ws-paper transition-colors"
                disabled={submitting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="rounded-xl bg-ws-deep/40 border border-ws-line px-4 py-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ws-mist">Créneau</div>
                <div className="text-sm font-semibold text-ws-paper mt-1">
                  {new Date(pendingSlot.start_at).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </div>
                <div className="text-sm text-ws-accent font-mono mt-0.5">
                  {pendingSlot.label} →{' '}
                  {new Date(pendingSlot.end_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-ws-mist block mb-1">
                  Objet du rendez-vous
                </label>
                <input
                  type="text"
                  value={bookingTitle}
                  onChange={(e) => setBookingTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-ws-deep border border-ws-line text-ws-paper text-sm focus:outline-none focus:border-ws-accent/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-ws-mist block mb-1">
                  Note (optionnelle)
                </label>
                <textarea
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  rows={3}
                  placeholder="Sujet à aborder, contexte…"
                  className="w-full px-3 py-2 rounded-lg bg-ws-deep border border-ws-line text-ws-paper text-sm resize-none focus:outline-none focus:border-ws-accent/50"
                />
              </div>

              {submitError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {submitError}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-ws-line flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-sm text-ws-mist hover:text-ws-paper transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting || !bookingTitle.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-ws-accent text-ws-void hover:bg-ws-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Réservation…
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
