import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ClientDocument } from '../lib/types';

const BUCKET = 'client-documents';

/**
 * Côté portail : upload un fichier en réponse à une demande créée par l'admin.
 * - Stocke le fichier dans le bucket `client-documents` au chemin {clientId}/{uuid}-{filename}
 * - Met à jour la ligne `client_documents` : file_path, mime_type, file_size, status='received', received_at
 * - RLS Supabase : le client ne peut UPDATE que les demandes liées à son client_id (cf. policy `auth_update_own_request`)
 */
export function useResourceRequests() {
  const respond = useCallback(
    async (request: ClientDocument, file: File): Promise<ClientDocument> => {
      if (!supabase) throw new Error('Supabase non configuré');

      // 1) Upload du fichier
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
      const uid =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const path = `${request.client_id}/${uid}-${safeName}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });
      if (upErr) throw upErr;

      // 2) Update de la ligne demande → status='received'
      const { data, error: updErr } = await supabase
        .from('client_documents')
        .update({
          file_path: path,
          mime_type: file.type || null,
          file_size: file.size,
          request_status: 'received',
          received_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', request.id)
        .select('*')
        .single();
      if (updErr) {
        // Rollback storage si update échoue
        await supabase.storage.from(BUCKET).remove([path]);
        throw updErr;
      }

      return data as ClientDocument;
    },
    [],
  );

  const getSignedUrl = useCallback(
    async (filePath: string, ttlSeconds = 300): Promise<string | null> => {
      if (!supabase) return null;
      const { data, error: err } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, ttlSeconds);
      if (err) return null;
      return data?.signedUrl ?? null;
    },
    [],
  );

  return { respond, getSignedUrl };
}
