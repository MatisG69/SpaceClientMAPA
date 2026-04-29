export type ProjectStepStatus = 'pending' | 'in_progress' | 'done';
export type ProjectStatus =
  | 'planning'
  | 'quote_sent'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'on_hold';
export type ProjectType = 'website' | 'ecommerce' | 'webapp' | 'redesign' | 'maintenance' | 'seo' | 'automation' | 'other';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  type: ProjectType | null;
  site_url: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  budget: number | null;
  created_at?: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'signed' | 'refused' | 'expired';

export interface Quote {
  id: string;
  project_id: string | null;
  title: string;
  quote_number: string | null;
  amount: number;
  status: QuoteStatus;
  valid_until: string | null;
  deposit_requested: boolean;
  deposit_amount: number | null;
  signed_at: string | null;
  created_at: string;
  /** Date d'acompte attendue (texte ISO yyyy-mm-dd) — utilisée pour la génération du PDF de facture liée. */
  expected_acompte_date?: string | null;
  /** Date de livraison/solde attendue (texte ISO yyyy-mm-dd) — utilisée pour la génération du PDF de facture liée. */
  expected_delivery_date?: string | null;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  project_id: string | null;
  invoice_number: string | null;
  amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  /** Référence au devis dont cette facture découle (acompte/solde). */
  source_quote_id?: string | null;
}

export type CalendarRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  recurrence: CalendarRecurrence;
  project_id?: string | null;
  client_id?: string | null;
  booking_source?: 'admin' | 'portal' | null;
  portal_user_id?: string | null;
}

export interface AvailabilityRule {
  id: string;
  /** 0 = dimanche, 1 = lundi, …, 6 = samedi (Date.getDay()) */
  weekday: number;
  /** 'HH:MM' ou 'HH:MM:SS' */
  start_time: string;
  end_time: string;
  slot_duration_min: number;
  buffer_min: number;
  meeting_label: string | null;
  active: boolean;
}

export interface BookingSlot {
  /** ISO timestamp UTC — début du créneau */
  start_at: string;
  /** ISO timestamp UTC — fin du créneau */
  end_at: string;
  /** 'HH:MM' local pour affichage */
  label: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  position: number;
}

/**
 * Brief & spécifications du projet (1:1).
 * Le client peut consulter ET valider numériquement le périmètre.
 */
export interface ProjectBrief {
  id: string;
  project_id: string;
  objectives: string | null;
  scope_in: string | null;
  scope_out: string | null;
  constraints: string | null;
  deliverables: string | null;
  figma_url: string | null;
  notes: string | null;
  validated_at: string | null;
  validated_by_ip: string | null;
  validated_signature: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectPhase = 'analyse' | 'conception' | 'dev' | 'ajustements' | 'livraison';

export interface ProjectStep {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  description: string | null;
  status: ProjectStepStatus;
  started_at: string | null;
  completed_at: string | null;
  phase?: ProjectPhase | null;
  planned_start?: string | null;
  planned_end?: string | null;
  deliverable_url?: string | null;
  requires_validation?: boolean;
  validated_at?: string | null;
  validated_signature?: string | null;
  validated_by_ip?: string | null;
  created_at: string;
  updated_at: string;
}

export type PortalMessageSender = 'client' | 'team';

export interface PortalMessage {
  id: string;
  project_id: string;
  sender: PortalMessageSender;
  content: string;
  read_by_admin: boolean;
  read_by_client: boolean;
  created_at: string;
}

export interface PortalUser {
  id: string;
  email: string;
  name: string | null;
  client_id: string | null;
  /** @deprecated conservé pour rétro-compatibilité */
  project_id?: string | null;
}

/* ─────────────────────────────────────────────────────────────────
   Types « full » utilisés uniquement par les générateurs PDF
   (devis / factures côté client). Calqués sur les types CRM.
   ───────────────────────────────────────────────────────────────── */

export interface Client {
  id: string;
  name: string;
  /** Prénom du contact — utilisé sur devis/factures (cas mixte). */
  first_name?: string | null;
  /** Nom de famille du contact — affiché en MAJUSCULES sur devis/factures. */
  last_name?: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  status?: string;
  source?: string | null;
  notes?: string | null;
  legal_form?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  contact_role?: string | null;
  profession?: string | null;
  avatar_color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  site_url: string | null;
  status: ProjectStatus;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  type: ProjectType | null;
  has_recurring_support?: boolean;
  recurring_support_amount?: number | null;
  recurring_support_label?: string | null;
  /** Périmètre de la prestation principale (texte multi-ligne). */
  prestation_scope?: string | null;
  /** Périmètre de la prestation de suivi mensuel. */
  recurring_support_scope?: string | null;
  /** Titre custom du contrat de suivi. */
  recurring_support_title?: string | null;
  /** Description courte du suivi (table tarification). */
  recurring_support_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

/* Document arbitraire uploadé par l'admin pour le client */
export type ClientDocumentCategory =
  | 'contrat'
  | 'livrable'
  | 'compte-rendu'
  | 'charte'
  | 'autre';

export type RequestStatus = 'requested' | 'received' | 'validated' | 'rejected';
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface ClientDocument {
  id: string;
  client_id: string;
  project_id: string | null;
  category: ClientDocumentCategory;
  name: string;
  description: string | null;
  /** Null si c'est une demande pas encore remplie par le client. */
  file_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  /** true = demande de l'admin que le client doit honorer en uploadant un fichier. */
  is_request: boolean;
  request_status: RequestStatus | null;
  request_due_date: string | null;
  request_priority: RequestPriority;
  request_admin_notes: string | null;
  received_at: string | null;
  validated_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

/* ─── Sprint 5 : Collaboration projet (CR + comptes-rendus) ─── */

export type ChangeRequestStatus =
  | 'submitted'
  | 'estimated'
  | 'approved'
  | 'rejected'
  | 'completed';
export type ChangeRequestUrgency = 'low' | 'normal' | 'high' | 'urgent';

export interface ChangeRequest {
  id: string;
  project_id: string;
  client_id: string;
  description: string;
  urgency: ChangeRequestUrgency;
  estimated_days: number | null;
  estimated_amount: number | null;
  status: ChangeRequestStatus;
  submitted_by_signature: string | null;
  submitted_at: string;
  approved_by_signature: string | null;
  approved_at: string | null;
  approved_by_ip: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/* ─── Sprint 7 : Témoignages, NDA, Suggestions ─── */

export interface Testimonial {
  id: string;
  project_id: string;
  client_id: string;
  rating: number;
  content: string;
  author_signature: string;
  author_role: string | null;
  allow_public: boolean;
  allow_logo: boolean;
  approved: boolean;
  approved_at: string | null;
  rejection_reason: string | null;
  signed_at: string;
  signed_by_ip: string | null;
  created_at: string;
  updated_at: string;
}

export type NdaStatus = 'draft' | 'sent' | 'signed' | 'expired' | 'cancelled';

export interface NdaAgreement {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  content: string;
  expires_at: string | null;
  signed_at: string | null;
  signed_by_signature: string | null;
  signed_by_ip: string | null;
  status: NdaStatus;
  created_at: string;
  updated_at: string;
}

export type SuggestionKind = 'feature' | 'improvement' | 'bug' | 'question' | 'other';
export type SuggestionStatus = 'new' | 'considering' | 'planned' | 'done' | 'declined';

export interface ProjectSuggestion {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  description: string | null;
  kind: SuggestionKind;
  status: SuggestionStatus;
  admin_response: string | null;
  submitted_by_signature: string | null;
  created_at: string;
  updated_at: string;
}

export type UptimeStatus = 'up' | 'down' | 'unknown' | 'maintenance';

export interface ProjectProduction {
  id: string;
  project_id: string;
  prod_url: string | null;
  hosting_provider: string | null;
  hosting_dashboard_url: string | null;
  repo_url: string | null;
  cms_url: string | null;
  launch_date: string | null;
  lighthouse_performance: number | null;
  lighthouse_accessibility: number | null;
  lighthouse_seo: number | null;
  lighthouse_best_practices: number | null;
  cwv_lcp_seconds: number | null;
  cwv_cls: number | null;
  cwv_inp_ms: number | null;
  lighthouse_checked_at: string | null;
  lighthouse_report_url: string | null;
  uptime_status: UptimeStatus;
  uptime_checked_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingKind = 'visio' | 'physique' | 'telephone' | 'autre';

export interface MeetingNote {
  id: string;
  project_id: string;
  client_id: string;
  meeting_date: string;
  meeting_duration_minutes: number | null;
  meeting_attendees: string | null;
  meeting_kind: MeetingKind;
  title: string;
  decisions: string | null;
  actions: string | null;
  next_steps: string | null;
  validated_at: string | null;
  validated_by_signature: string | null;
  validated_by_ip: string | null;
  created_at: string;
  updated_at: string;
}
