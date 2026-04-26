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
