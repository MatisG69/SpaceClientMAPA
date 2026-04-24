export type ProjectStepStatus = 'pending' | 'in_progress' | 'done';
export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  site_url: string | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
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
  project_id: string | null;
}
