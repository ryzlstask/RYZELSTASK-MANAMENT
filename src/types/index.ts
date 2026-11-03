export type DepartmentCode = 'DEV' | 'DESIGN' | 'SEO' | 'CONTENT' | 'QA' | 'MANAGEMENT';

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  head_employee_id?: string;
  is_active: boolean;
  created_at: string;
}

export type EmployeeRole = 'admin' | 'task_manager' | 'team_lead' | 'employee' | 'reviewer';
export type EmployeeStatus = 'active' | 'on_leave' | 'busy' | 'inactive';

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: EmployeeRole;
  department_id: string;
  position: string;
  current_workload_hours: number;
  max_weekly_capacity_hours: number;
  status: EmployeeStatus;
  avatar_url?: string;
  skills?: EmployeeSkill[];
}

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  is_primary: boolean;
}

export interface EmployeeAvailability {
  id: string;
  employee_id: string;
  date: string;
  available_hours: number;
  status: 'available' | 'partially_booked' | 'fully_booked' | 'holiday' | 'sick_leave';
  notes?: string;
}

export interface EmployeeNotificationPreferences {
  id: string;
  employee_id: string;
  whatsapp_enabled: boolean;
  daily_reminder_time: string;
  timezone: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notify_on_assignment: boolean;
  notify_on_deadline_warning: boolean;
  notify_on_overdue: boolean;
}

export interface Client {
  id: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  industry: string;
  tier: 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'paused' | 'terminated';
  monthly_retainer: number;
  notes?: string;
  created_at: string;
  websites_count?: number;
}

export type WebsitePlatform = 'WordPress' | 'Shopify' | 'Custom Next.js' | 'Webflow' | 'Magento' | 'Other';
export type WebsiteStatus = 'live' | 'staging' | 'development' | 'maintenance' | 'inactive';

export interface ClientWebsite {
  id: string;
  client_id: string;
  client_name?: string;
  website_name: string;
  domain: string;
  website_type: 'ecommerce' | 'corporate' | 'blog' | 'portfolio' | 'landing_page' | 'saas';
  platform: WebsitePlatform;
  assigned_department_id: string;
  responsible_developer_id?: string;
  seo_responsible_id?: string;
  designer_id?: string;
  website_manager_id?: string;
  current_status: WebsiteStatus;
  hosting_reference?: string;
  launch_date?: string;
  created_at: string;
  pending_changes_count?: number;
  active_tasks_count?: number;
}

export type ChangeRequestStatus =
  | 'New Request'
  | 'Awaiting Clarification'
  | 'Approved'
  | 'Assigned'
  | 'In Progress'
  | 'Under Review'
  | 'Changes Required'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export interface WebsiteChangeRequest {
  id: string;
  change_request_code: string;
  client_id: string;
  client_name?: string;
  website_id: string;
  website_domain?: string;
  request_title: string;
  detailed_description: string;
  requester: string;
  assigned_department_id: string;
  assigned_employee_id?: string;
  reviewer_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string;
  current_status: ChangeRequestStatus;
  before_change_reference?: string;
  before_attachment_url?: string;
  after_evidence_screenshot_url?: string;
  completion_notes?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WebsiteChangeHistory {
  id: string;
  change_request_id: string;
  actor_name: string;
  previous_status: ChangeRequestStatus;
  new_status: ChangeRequestStatus;
  notes: string;
  created_at: string;
}

export type TaskCategory =
  | 'Website design'
  | 'Frontend development'
  | 'Backend development'
  | 'WordPress development'
  | 'Shopify development'
  | 'Bug fixing'
  | 'Website maintenance'
  | 'SEO'
  | 'Speed optimization'
  | 'Content updates'
  | 'Landing page creation'
  | 'Security updates'
  | 'Website migration'
  | 'Other';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus =
  | 'pending_assignment'
  | 'proposed_ai'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'under_review'
  | 'changes_requested'
  | 'completed'
  | 'blocked'
  | 'cancelled';

export interface Task {
  id: string;
  task_code: string;
  title: string;
  description: string;
  client_id?: string;
  client_name?: string;
  website_id?: string;
  website_domain?: string;
  project_name?: string;
  department_id: string;
  category: TaskCategory;
  assigned_employee_id?: string;
  assigned_employee_name?: string;
  reviewer_id?: string;
  reviewer_name?: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_hours: number;
  actual_hours: number;
  deliverables?: string;
  deadline: string;
  accepted_at?: string;
  completed_at?: string;
  ai_generated?: boolean;
  ai_confidence_score?: number;
  ai_explanation?: string;
  image_url?: string;
  employee_remarks?: string;
  employee_remarks_history?: Array<{ message: string; timestamp: string }>;
  last_reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskExtensionRequest {
  id: string;
  task_id: string;
  task_title?: string;
  employee_id: string;
  employee_name?: string;
  original_deadline: string;
  requested_deadline: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  manager_id?: string;
  decision_notes?: string;
  created_at: string;
}

export interface TaskCompletionEvidence {
  id: string;
  task_id: string;
  employee_id: string;
  evidence_type: 'link' | 'screenshot' | 'document' | 'code_pr';
  evidence_url: string;
  notes?: string;
  submitted_at: string;
}

export interface EmployeeTaskResponse {
  id: string;
  task_id: string;
  employee_id: string;
  channel: 'whatsapp' | 'portal' | 'email';
  raw_response: string;
  interpreted_intent: 'accept' | 'extension_request' | 'blocker_report' | 'completion' | 'question';
  parsed_metadata: Record<string, any>;
  created_at: string;
}

export interface ContentCalendar {
  id: string;
  client_id: string;
  client_name?: string;
  calendar_name: string;
  target_month: string;
  is_active: boolean;
  posts_count?: number;
}

export interface ContentPost {
  id: string;
  calendar_id: string;
  client_id: string;
  client_name?: string;
  platform: 'Instagram' | 'LinkedIn' | 'Facebook' | 'TikTok' | 'X/Twitter' | 'YouTube';
  publishing_date: string;
  publishing_time: string;
  content_type: 'Static Image' | 'Carousel' | 'Reels/Shorts' | 'Video' | 'Article' | 'Story';
  caption: string;
  hashtags: string;
  creative_asset_url?: string;
  designer_id?: string;
  designer_name?: string;
  reviewer_id?: string;
  publisher_employee_id?: string;
  production_deadline?: string;
  approval_status: 'draft' | 'pending_production' | 'in_review' | 'approved' | 'rejected';
  publishing_status: 'scheduled' | 'ready_to_publish' | 'published' | 'failed';
  published_live_url?: string;
  published_at?: string;
  t_minus_days?: number;
}

export interface WhatsAppConversation {
  id: string;
  phone_number: string;
  contact_name: string;
  contact_type: 'employee' | 'client' | 'other';
  employee_id?: string;
  client_id?: string;
  is_human_takeover: boolean;
  assigned_agent_id?: string;
  unread_count: number;
  last_message_at: string;
  last_message_preview: string;
  internal_notes?: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: 'incoming' | 'outgoing';
  message_type: 'text' | 'template' | 'image' | 'document';
  body: string;
  media_url?: string;
  template_name?: string;
  delivery_status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message?: string;
  sent_by_ai: boolean;
  created_at: string;
}

export interface ReminderPolicy {
  id: string;
  policy_name: string;
  description: string;
  event_trigger:
    | 'new_assignment'
    | 'unaccepted_24h'
    | 'unaccepted_48h'
    | 'daily_summary'
    | 'deadline_48h'
    | 'deadline_24h'
    | 'overdue'
    | 'blocked_escalation'
    | 'submission_review';
  delay_hours: number;
  channel: 'whatsapp';
  is_enabled: boolean;
}

export interface AutomationExecutionLog {
  id: string;
  workflow_name: string;
  status: 'success' | 'warning' | 'failed';
  records_processed: number;
  execution_time_ms: number;
  details: string;
  error_stack?: string;
  created_at: string;
}

export interface AutomationRetryQueueItem {
  id: string;
  workflow_name: string;
  payload: Record<string, any>;
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  last_error?: string;
  status: 'queued' | 'processing' | 'resolved' | 'abandoned';
}

export interface AIUsageLog {
  id: string;
  feature_name: string;
  model_name: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  duration_ms: number;
  status: 'success' | 'rate_limited' | 'failed';
  created_at: string;
}

export interface AICostSummary {
  total_requests: number;
  today_requests: number;
  month_requests: number;
  tokens_consumed: number;
  estimated_cost_usd: number;
  monthly_budget_usd: number;
  failed_requests: number;
  avg_response_time_ms: number;
}

export interface AuditLog {
  id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_state: Record<string, any>;
  new_state: Record<string, any>;
  created_at: string;
}

export interface EmployeeRecommendationScore {
  employee: Employee;
  total_score: number;
  skill_score: number;
  workload_score: number;
  availability_score: number;
  history_score: number;
  explanation: string;
  workload_status: 'low' | 'optimal' | 'heavy' | 'overloaded';
}

