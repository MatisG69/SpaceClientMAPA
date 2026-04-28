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
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  position: number;
}

export interface ProjectStep {
  id: string;
  project_id: string;
  order_index: number;
  title: string;
  description: string | null;
  status: ProjectStepStatus;
  started_at: string | null;
  completed_at: string | null;
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

export interface ClientDocument {
  id: string;
  client_id: string;
  project_id: string | null;
  category: ClientDocumentCategory;
  name: string;
  description: string | null;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}
