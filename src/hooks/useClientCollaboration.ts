import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  ChangeRequest,
  ChangeRequestUrgency,
  MeetingNote,
} from '../lib/types';

async function fetchPublicIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    if (!res.ok) return null;
    const json = (await res.json()) as { ip?: string };
    return json.ip ?? null;
  } catch {
    return null;
  }
}

/**
 * Collaboration projet côté client : demandes de modification (CR)
 * + comptes-rendus de réunion. Lecture scopée par RLS (`client_id`
 * dérivé du portal_user).
 */
export function useClientCollaboration(projectId: string | null, clientId: string | null) {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) {
      setChangeRequests([]);
      setMeetingNotes([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [crRes, mnRes] = await Promise.all([
        supabase
          .from('change_requests')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('meeting_notes')
          .select('*')
          .eq('project_id', projectId)
          .order('meeting_date', { ascending: false }),
      ]);
      if (crRes.error) throw crRes.error;
      if (mnRes.error) throw mnRes.error;
      setChangeRequests((crRes.data ?? []) as ChangeRequest[]);
      setMeetingNotes((mnRes.data ?? []) as MeetingNote[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const submitChangeRequest = useCallback(
    async (input: {
      description: string;
      urgency: ChangeRequestUrgency;
      signature: string;
    }): Promise<ChangeRequest> => {
      if (!projectId || !clientId) throw new Error('Projet introuvable');
      const description = input.description.trim();
      if (!description) throw new Error('Description requise');
      const signature = input.signature.trim() || null;
      const { data, error: err } = await supabase
        .from('change_requests')
        .insert({
          project_id: projectId,
          client_id: clientId,
          description,
          urgency: input.urgency,
          submitted_by_signature: signature,
        })
        .select('*')
        .single();
      if (err) throw err;
      const created = data as ChangeRequest;
      setChangeRequests((prev) => [created, ...prev]);
      return created;
    },
    [projectId, clientId],
  );

  const approveEstimate = useCallback(
    async (id: string, signature: string): Promise<ChangeRequest> => {
      const trimmed = signature.trim();
      if (!trimmed) throw new Error('Signature requise');
      const ip = await fetchPublicIp();
      const { data, error: err } = await supabase
        .from('change_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by_signature: trimmed,
          approved_by_ip: ip,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (err) throw err;
      const updated = data as ChangeRequest;
      setChangeRequests((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    },
    [],
  );

  const rejectEstimate = useCallback(
    async (id: string, reason: string): Promise<ChangeRequest> => {
      const trimmed = reason.trim();
      const { data, error: err } = await supabase
        .from('change_requests')
        .update({
          status: 'rejected',
          rejection_reason: trimmed || null,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (err) throw err;
      const updated = data as ChangeRequest;
      setChangeRequests((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    },
    [],
  );

  const validateMeetingNote = useCallback(
    async (id: string, signature: string): Promise<MeetingNote> => {
      const trimmed = signature.trim();
      if (!trimmed) throw new Error('Signature requise');
      const ip = await fetchPublicIp();
      const { data, error: err } = await supabase
        .from('meeting_notes')
        .update({
          validated_at: new Date().toISOString(),
          validated_by_signature: trimmed,
          validated_by_ip: ip,
        })
        .eq('id', id)
        .select('*')
        .single();
      if (err) throw err;
      const updated = data as MeetingNote;
      setMeetingNotes((prev) => prev.map((m) => (m.id === id ? updated : m)));
      return updated;
    },
    [],
  );

  return {
    changeRequests,
    meetingNotes,
    loading,
    error,
    refetch,
    submitChangeRequest,
    approveEstimate,
    rejectEstimate,
    validateMeetingNote,
  };
}
