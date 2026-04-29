import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AvailabilityRule, BookingSlot } from '../lib/types';

/** Plage occupée renvoyée par la vue `calendar_busy_ranges`. */
interface BusyRange {
  id: string;
  start_at: string;
  end_at: string;
}

interface UseAvailabilityResult {
  loading: boolean;
  error: string | null;
  /** Vrai si au moins une règle active existe pour les 14 prochains jours. */
  hasAvailability: boolean;
  /** Les jours sur lesquels au moins un créneau libre est disponible (ISO YYYY-MM-DD). */
  availableDays: string[];
  /** Renvoie les créneaux libres pour un jour donné (date locale ISO YYYY-MM-DD). */
  getSlotsForDay: (dateISO: string) => BookingSlot[];
  /** Enregistre un booking. Renvoie l'id de l'event créé ou jette une erreur. */
  bookSlot: (slot: BookingSlot, title: string, description?: string) => Promise<string>;
  refresh: () => void;
}

const HORIZON_DAYS = 14;

/** Crée un objet Date à partir d'une date locale + heure 'HH:MM[:SS]'. */
function localDateAtTime(dateISO: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((s) => Number(s));
  const [y, mo, d] = dateISO.split('-').map((s) => Number(s));
  return new Date(y, mo - 1, d, h, m, 0, 0);
}

/** Renvoie 'YYYY-MM-DD' pour une Date locale. */
function toLocalDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Hook de disponibilité de RDV. Récupère :
 *   1. les règles `availability_rules` actives,
 *   2. les plages occupées de la vue `calendar_busy_ranges` sur l'horizon,
 * puis expose le calcul de slots libres et l'enregistrement d'un booking.
 *
 * Le client ne voit pas les détails des autres RDV (titre, autre client) :
 * la vue `calendar_busy_ranges` n'expose que start_at / end_at.
 */
export function useAvailability(
  clientId: string | null | undefined,
  portalUserId: string | null | undefined
): UseAvailabilityResult {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [busy, setBusy] = useState<BusyRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const horizonStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [refreshKey]);

  const horizonEnd = useMemo(() => {
    const d = new Date(horizonStart);
    d.setDate(d.getDate() + HORIZON_DAYS);
    return d;
  }, [horizonStart]);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);

    (async () => {
      const [rulesRes, busyRes] = await Promise.all([
        supabase
          .from('availability_rules')
          .select('id, weekday, start_time, end_time, slot_duration_min, buffer_min, meeting_label, active')
          .eq('active', true)
          .order('weekday', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('calendar_busy_ranges')
          .select('id, start_at, end_at')
          .gte('start_at', horizonStart.toISOString())
          .lt('start_at', horizonEnd.toISOString()),
      ]);

      if (aborted) return;

      if (rulesRes.error) {
        setError(rulesRes.error.message);
        setLoading(false);
        return;
      }
      if (busyRes.error) {
        setError(busyRes.error.message);
        setLoading(false);
        return;
      }

      setRules((rulesRes.data ?? []) as AvailabilityRule[]);
      setBusy((busyRes.data ?? []) as BusyRange[]);
      setLoading(false);
    })();

    return () => {
      aborted = true;
    };
  }, [horizonStart, horizonEnd]);

  const getSlotsForDay = useCallback(
    (dateISO: string): BookingSlot[] => {
      const target = new Date(`${dateISO}T00:00:00`);
      const weekday = target.getDay();
      const todays = rules.filter((r) => r.weekday === weekday);
      if (todays.length === 0) return [];

      const now = new Date();
      const slots: BookingSlot[] = [];

      for (const rule of todays) {
        const slotMs = rule.slot_duration_min * 60_000;
        const bufferMs = rule.buffer_min * 60_000;
        let cursor = localDateAtTime(dateISO, rule.start_time);
        const ruleEnd = localDateAtTime(dateISO, rule.end_time);

        while (cursor.getTime() + slotMs <= ruleEnd.getTime()) {
          const slotStart = new Date(cursor);
          const slotEnd = new Date(cursor.getTime() + slotMs);

          // Filtre passé immédiat (pas de booking dans une heure révolue)
          if (slotStart.getTime() <= now.getTime()) {
            cursor = new Date(cursor.getTime() + slotMs + bufferMs);
            continue;
          }

          // Vérification conflit avec une plage occupée
          const conflict = busy.some((b) => {
            const bs = new Date(b.start_at).getTime();
            const be = new Date(b.end_at).getTime();
            return slotStart.getTime() < be && slotEnd.getTime() > bs;
          });

          if (!conflict) {
            slots.push({
              start_at: slotStart.toISOString(),
              end_at: slotEnd.toISOString(),
              label: slotStart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            });
          }

          cursor = new Date(cursor.getTime() + slotMs + bufferMs);
        }
      }

      return slots;
    },
    [rules, busy]
  );

  const availableDays = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const d = new Date(horizonStart);
      d.setDate(d.getDate() + i);
      const iso = toLocalDateISO(d);
      if (getSlotsForDay(iso).length > 0) days.push(iso);
    }
    return days;
  }, [horizonStart, getSlotsForDay]);

  const bookSlot = useCallback(
    async (slot: BookingSlot, title: string, description?: string): Promise<string> => {
      if (!clientId || !portalUserId) {
        throw new Error('Identifiants client/portail manquants');
      }

      const { data, error: insertErr } = await supabase
        .from('calendar_events')
        .insert({
          title,
          description: description ?? null,
          start_at: slot.start_at,
          end_at: slot.end_at,
          all_day: false,
          recurrence: 'none',
          client_id: clientId,
          booking_source: 'portal',
          portal_user_id: portalUserId,
          color: '#C9A84C',
        })
        .select('id')
        .single();

      if (insertErr || !data) {
        throw new Error(insertErr?.message ?? 'Échec de la réservation');
      }

      // Optimistic refresh — la nouvelle plage est immédiatement marquée occupée
      setBusy((prev) => [...prev, { id: data.id, start_at: slot.start_at, end_at: slot.end_at }]);
      return data.id;
    },
    [clientId, portalUserId]
  );

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return {
    loading,
    error,
    hasAvailability: rules.length > 0,
    availableDays,
    getSlotsForDay,
    bookSlot,
    refresh,
  };
}
