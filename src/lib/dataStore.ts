import {
  Department,
  Employee,
  Client,
  ClientWebsite,
  WebsiteChangeRequest,
  WebsiteChangeHistory,
  Task,
  TaskExtensionRequest,
  ContentCalendar,
  ContentPost,
  WhatsAppConversation,
  WhatsAppMessage,
  ReminderPolicy,
  AutomationExecutionLog,
  AIUsageLog,
  AuditLog,
  EmployeeRecommendationScore,
  TaskPriority,
  TaskCategory
} from '@/types';
import { resolvePhoneFromJidOrNumber, normalizePhoneNumber } from '@/lib/phoneUtils';

// ============================================================================
// INITIAL SEED DATA FOR RYZELS AI WORKSPACE OPERATIONS
// ============================================================================

export const initialDepartments: Department[] = [
  { id: 'dept-1', name: 'Web Development', code: 'DEV', description: 'Full-stack, WordPress, Shopify and custom apps', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'dept-2', name: 'UI/UX & Brand Design', code: 'DESIGN', description: 'Web design, graphic assets and social media creatives', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'dept-3', name: 'SEO & Growth Optimization', code: 'SEO', description: 'Technical SEO, metadata, speed optimization and search indexing', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'dept-4', name: 'Content & Social Media', code: 'CONTENT', description: 'Copywriting, content calendars and publishing orchestration', is_active: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'dept-5', name: 'Operations & QA', code: 'OPS', description: 'Task dispatch, client approvals, code reviews and delivery assurance', is_active: true, created_at: '2026-01-01T00:00:00Z' },
];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-mgr',
    full_name: 'Talha Khan',
    email: 'talha.khan@ryzels.com',
    phone_number: '+923001234567',
    role: 'task_manager',
    department_id: 'dept-5',
    position: 'Head of Operations & Task Manager',
    current_workload_hours: 0,
    max_weekly_capacity_hours: 45,
    status: 'active',
    skills: [
      { id: 'sk-mgr', employee_id: 'emp-mgr', skill_name: 'Operations Management', proficiency_level: 'expert', years_experience: 10, is_primary: true }
    ]
  }
];

export const initialClients: Client[] = [
  {
    id: 'client-1',
    company_name: 'ABC Group',
    contact_person: 'Robert Sterling',
    contact_email: 'robert@abcgroup.com',
    contact_phone: '+1 415 555 0192',
    industry: 'Conglomerate & Technology',
    tier: 'enterprise',
    status: 'active',
    monthly_retainer: 8500,
    notes: 'Owns 3 distinct digital properties: corporate, electronics retail, and professional services.',
    created_at: '2026-01-10T10:00:00Z',
    websites_count: 3
  },
  {
    id: 'client-2',
    company_name: 'Apex Digital Global',
    contact_person: 'Elena Rostova',
    contact_email: 'elena@apexdigital.io',
    contact_phone: '+44 20 7946 0912',
    industry: 'Fintech & Cloud Infrastructure',
    tier: 'premium',
    status: 'active',
    monthly_retainer: 5500,
    notes: 'Rapidly growing SaaS platform with frequent landing page requests.',
    created_at: '2026-01-15T14:30:00Z',
    websites_count: 1
  },
  {
    id: 'client-3',
    company_name: 'Nexus Healthcare',
    contact_person: 'Dr. Marcus Vance',
    contact_email: 'marcus@nexushealth.org',
    contact_phone: '+1 312 555 0147',
    industry: 'Healthcare & Medical Devices',
    tier: 'enterprise',
    status: 'active',
    monthly_retainer: 9200,
    notes: 'Strict HIPAA compliance required on all portals.',
    created_at: '2026-02-01T09:15:00Z',
    websites_count: 2
  }
];

export const initialClientWebsites: ClientWebsite[] = [
  {
    id: 'web-1',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_name: 'ABC Group Corporate',
    domain: 'abcgroup.com',
    website_type: 'corporate',
    platform: 'Custom Next.js',
    assigned_department_id: 'dept-1',
    responsible_developer_id: undefined,
    seo_responsible_id: undefined,
    designer_id: undefined,
    website_manager_id: 'emp-mgr',
    current_status: 'live',
    hosting_reference: 'AWS-ECS-CLUST-01',
    launch_date: '2025-06-15',
    created_at: '2026-01-10T11:00:00Z',
    pending_changes_count: 1,
    active_tasks_count: 2
  },
  {
    id: 'web-2',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_name: 'ABC Electronics Store',
    domain: 'abcelectronics.com',
    website_type: 'ecommerce',
    platform: 'Shopify',
    assigned_department_id: 'dept-1',
    responsible_developer_id: undefined,
    seo_responsible_id: undefined,
    designer_id: undefined,
    website_manager_id: 'emp-mgr',
    current_status: 'live',
    hosting_reference: 'Shopify-Plus-Tier2',
    launch_date: '2025-09-01',
    created_at: '2026-01-10T11:05:00Z',
    pending_changes_count: 2,
    active_tasks_count: 3
  },
  {
    id: 'web-3',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_name: 'ABC Professional Services',
    domain: 'abcservices.com',
    website_type: 'corporate',
    platform: 'WordPress',
    assigned_department_id: 'dept-1',
    responsible_developer_id: undefined,
    seo_responsible_id: undefined,
    designer_id: undefined,
    website_manager_id: 'emp-mgr',
    current_status: 'live',
    hosting_reference: 'Kinsta-WP-Dedicated-04',
    launch_date: '2025-11-20',
    created_at: '2026-01-10T11:10:00Z',
    pending_changes_count: 0,
    active_tasks_count: 1
  },
  {
    id: 'web-4',
    client_id: 'client-2',
    client_name: 'Apex Digital Global',
    website_name: 'Apex Digital Platform',
    domain: 'apexdigital.io',
    website_type: 'saas',
    platform: 'Custom Next.js',
    assigned_department_id: 'dept-1',
    responsible_developer_id: undefined,
    seo_responsible_id: undefined,
    designer_id: undefined,
    website_manager_id: 'emp-mgr',
    current_status: 'live',
    hosting_reference: 'Vercel-Enterprise-Org',
    launch_date: '2026-01-05',
    created_at: '2026-01-15T15:00:00Z',
    pending_changes_count: 1,
    active_tasks_count: 1
  },
  {
    id: 'web-5',
    client_id: 'client-3',
    client_name: 'Nexus Healthcare',
    website_name: 'Nexus Health Main Portal',
    domain: 'nexushealth.org',
    website_type: 'corporate',
    platform: 'WordPress',
    assigned_department_id: 'dept-1',
    responsible_developer_id: undefined,
    seo_responsible_id: undefined,
    designer_id: undefined,
    website_manager_id: 'emp-mgr',
    current_status: 'live',
    hosting_reference: 'HIPAA-Cloud-Azure-33',
    launch_date: '2025-04-10',
    created_at: '2026-02-01T10:00:00Z',
    pending_changes_count: 0,
    active_tasks_count: 2
  }
];

export const initialWebsiteChangeRequests: WebsiteChangeRequest[] = [
  {
    id: 'wcr-1',
    change_request_code: 'WCR-2026-001',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_id: 'web-2',
    website_domain: 'abcelectronics.com',
    request_title: 'Change homepage hero banner & update flagship product pricing',
    detailed_description: 'Update the hero slider with Q4 promotional graphics for the OLED displays and adjust catalog pricing by -15% across 24 SKUs.',
    requester: 'Robert Sterling (Client VP)',
    assigned_department_id: 'dept-1',
    assigned_employee_id: undefined,
    reviewer_id: 'emp-mgr',
    priority: 'high',
    deadline: '2026-11-04T17:00:00Z',
    current_status: 'In Progress',
    before_change_reference: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800',
    created_at: '2026-11-01T09:00:00Z',
    updated_at: '2026-11-02T11:00:00Z'
  },
  {
    id: 'wcr-2',
    change_request_code: 'WCR-2026-002',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_id: 'web-2',
    website_domain: 'abcelectronics.com',
    request_title: 'Fix mobile checkout responsiveness & button overlapping',
    detailed_description: 'On iPhone 15 Safari viewport, the PayPal express checkout button overlaps with the discount coupon input box.',
    requester: 'Support Desk Ticket #882',
    assigned_department_id: 'dept-1',
    assigned_employee_id: undefined,
    reviewer_id: 'emp-mgr',
    priority: 'urgent',
    deadline: '2026-11-03T14:00:00Z',
    current_status: 'Under Review',
    before_change_reference: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800',
    after_evidence_screenshot_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    completion_notes: 'Adjusted z-index and flex wrap styling in checkout-form.liquid. Verified on responsive simulator.',
    created_at: '2026-11-01T14:00:00Z',
    updated_at: '2026-11-02T16:30:00Z'
  },
  {
    id: 'wcr-3',
    change_request_code: 'WCR-2026-003',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_id: 'web-1',
    website_domain: 'abcgroup.com',
    request_title: 'Update contact information & Dubai regional office coordinates',
    detailed_description: 'Replace old DIFC address with new Downtown Dubai Boulevard Suite 401 and update contact phone numbers.',
    requester: 'Sarah Jenkins (Marketing Mgr)',
    assigned_department_id: 'dept-1',
    assigned_employee_id: undefined,
    reviewer_id: 'emp-mgr',
    priority: 'medium',
    deadline: '2026-11-05T18:00:00Z',
    current_status: 'New Request',
    created_at: '2026-11-02T08:30:00Z',
    updated_at: '2026-11-02T08:30:00Z'
  },
  {
    id: 'wcr-4',
    change_request_code: 'WCR-2026-004',
    client_id: 'client-2',
    client_name: 'Apex Digital Global',
    website_id: 'web-4',
    website_domain: 'apexdigital.io',
    request_title: 'Improve SEO metadata & Schema.org structure on Solutions pages',
    detailed_description: 'Add SoftwareApplication structured data, OpenGraph cards and canonical URL tags to all enterprise solution sub-routes.',
    requester: 'Elena Rostova',
    assigned_department_id: 'dept-3',
    assigned_employee_id: undefined,
    reviewer_id: 'emp-mgr',
    priority: 'medium',
    deadline: '2026-11-06T12:00:00Z',
    current_status: 'Assigned',
    created_at: '2026-11-02T10:15:00Z',
    updated_at: '2026-11-02T12:00:00Z'
  }
];

export const initialTasks: Task[] = [
  {
    id: 'tsk-1',
    task_code: 'TSK-2026-001',
    title: 'ABC Electronics — Homepage Hero Banner & Price Adjustments',
    description: 'Implement new promotional banner assets and update price tables across 24 product SKUs.',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_id: 'web-2',
    website_domain: 'abcelectronics.com',
    project_name: 'Q4 Promo Rollout',
    department_id: 'dept-1',
    category: 'Shopify development',
    assigned_employee_id: undefined,
    assigned_employee_name: 'Unassigned',
    reviewer_id: 'emp-mgr',
    reviewer_name: 'Talha Khan',
    priority: 'high',
    status: 'assigned',
    estimated_hours: 6,
    actual_hours: 0,
    deliverables: 'Live Shopify preview link with verified product prices and responsive banner.',
    deadline: '2026-11-03T17:00:00Z',
    created_at: '2026-11-01T09:30:00Z',
    updated_at: '2026-11-02T12:00:00Z'
  },
  {
    id: 'tsk-2',
    task_code: 'TSK-2026-002',
    title: 'ABC Group Corporate — Core Web Vitals & Speed Optimization',
    description: 'Optimize image formats (convert to WebP), defer non-critical JS chunks, achieve LCP < 1.8s.',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_id: 'web-1',
    website_domain: 'abcgroup.com',
    project_name: 'Performance Sprint',
    department_id: 'dept-3',
    category: 'Speed optimization',
    assigned_employee_id: undefined,
    assigned_employee_name: 'Unassigned',
    reviewer_id: 'emp-mgr',
    reviewer_name: 'Talha Khan',
    priority: 'medium',
    status: 'assigned',
    estimated_hours: 8,
    actual_hours: 0,
    deliverables: 'Google PageSpeed Insights score > 90 on Mobile and Desktop.',
    deadline: '2026-11-04T15:00:00Z',
    created_at: '2026-11-01T16:00:00Z',
    updated_at: '2026-11-02T09:15:00Z'
  },
  {
    id: 'tsk-3',
    task_code: 'TSK-2026-003',
    title: 'Apex Digital — Enterprise AI Security Landing Page',
    description: 'Design and build high-conversion landing page with dark futuristic aesthetics and lead capture form.',
    client_id: 'client-2',
    client_name: 'Apex Digital Global',
    website_id: 'web-4',
    website_domain: 'apexdigital.io',
    project_name: 'Growth Acquisition',
    department_id: 'dept-2',
    category: 'Landing page creation',
    assigned_employee_id: undefined,
    assigned_employee_name: 'Unassigned',
    reviewer_id: 'emp-mgr',
    reviewer_name: 'Talha Khan',
    priority: 'high',
    status: 'assigned',
    estimated_hours: 12,
    actual_hours: 0,
    deliverables: 'Figma mockups and production-ready Next.js component branch.',
    deadline: '2026-11-05T18:00:00Z',
    created_at: '2026-10-29T09:00:00Z',
    updated_at: '2026-11-02T16:00:00Z'
  },
  {
    id: 'tsk-4',
    task_code: 'TSK-2026-004',
    title: 'Nexus Healthcare — Patient Portal SSL & Security Audit',
    description: 'Perform dependency vulnerability scan, renew wildcard certificates, verify HIPAA encryption headers.',
    client_id: 'client-3',
    client_name: 'Nexus Healthcare',
    website_id: 'web-5',
    website_domain: 'nexushealth.org',
    project_name: 'Compliance 2026',
    department_id: 'dept-1',
    category: 'Security updates',
    assigned_employee_id: undefined,
    assigned_employee_name: 'Unassigned',
    reviewer_id: 'emp-mgr',
    reviewer_name: 'Talha Khan',
    priority: 'urgent',
    status: 'assigned', // Awaiting assignment to new employee
    estimated_hours: 5,
    actual_hours: 0,
    deliverables: 'Clean vulnerability scan report and A+ SSL Labs rating verification.',
    deadline: '2026-11-03T12:00:00Z',
    created_at: '2026-11-02T08:00:00Z',
    updated_at: '2026-11-02T08:00:00Z'
  },
  {
    id: 'tsk-5',
    task_code: 'TSK-2026-005',
    title: 'ABC Services — Fix Mobile Contact Form Validation',
    description: 'Contact form fails to submit on iOS devices due to date picker regex validation bug.',
    client_id: 'client-1',
    client_name: 'ABC Group',
    website_id: 'web-3',
    website_domain: 'abcservices.com',
    project_name: 'Maintenance',
    department_id: 'dept-1',
    category: 'Bug fixing',
    assigned_employee_id: undefined,
    assigned_employee_name: 'Unassigned',
    reviewer_id: 'emp-mgr',
    reviewer_name: 'Talha Khan',
    priority: 'high',
    status: 'assigned',
    estimated_hours: 4,
    actual_hours: 0,
    deliverables: 'Patched contact form verified across Chrome, Safari and Edge mobile browsers.',
    deadline: '2026-11-04T17:00:00Z',
    created_at: '2026-10-30T09:00:00Z',
    updated_at: '2026-11-02T10:00:00Z'
  }
];

export const initialExtensionRequests: TaskExtensionRequest[] = [];

export const initialContentCalendars: ContentCalendar[] = [
  {
    id: 'cal-1',
    client_id: 'client-1',
    client_name: 'ABC Group',
    calendar_name: 'ABC Electronics — Social Engine',
    target_month: 'November 2026',
    is_active: true,
    posts_count: 8
  },
  {
    id: 'cal-2',
    client_id: 'client-2',
    client_name: 'Apex Digital Global',
    calendar_name: 'Apex Digital — B2B Thought Leadership',
    target_month: 'November 2026',
    is_active: true,
    posts_count: 6
  },
  {
    id: 'cal-3',
    client_id: 'client-3',
    client_name: 'Nexus Healthcare',
    calendar_name: 'Nexus Health — Patient Wellness & Tech',
    target_month: 'November 2026',
    is_active: true,
    posts_count: 5
  }
];

export const initialContentPosts: ContentPost[] = [
  {
    id: 'post-1',
    calendar_id: 'cal-1',
    client_id: 'client-1',
    client_name: 'ABC Group',
    platform: 'Instagram',
    publishing_date: '2026-11-05',
    publishing_time: '18:00:00',
    content_type: 'Carousel',
    caption: 'Top 5 Smarter Ways to Upgrade Your Home Office in 2026. Minimalist setups meet high-efficiency OLED monitors.',
    hashtags: '#HomeOffice #TechTrends2026 #ABCElectronics #ProductivityHacks',
    creative_asset_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800',
    designer_id: undefined,
    designer_name: 'Unassigned',
    reviewer_id: 'emp-mgr',
    publisher_employee_id: undefined,
    production_deadline: '2026-11-04T12:00:00Z',
    approval_status: 'in_review',
    publishing_status: 'scheduled',
    t_minus_days: 3
  },
  {
    id: 'post-2',
    calendar_id: 'cal-2',
    client_id: 'client-2',
    client_name: 'Apex Digital Global',
    platform: 'LinkedIn',
    publishing_date: '2026-11-04',
    publishing_time: '14:00:00',
    content_type: 'Article',
    caption: 'Why Autonomous Workspaces are Outperforming Legacy ERP Systems: A 2026 Industry Benchmark Report.',
    hashtags: '#EnterpriseTech #AIOperations #FutureOfWork #SaaSLeadership',
    creative_asset_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    designer_id: undefined,
    designer_name: 'Unassigned',
    reviewer_id: 'emp-mgr',
    publisher_employee_id: undefined,
    production_deadline: '2026-11-03T16:00:00Z',
    approval_status: 'approved',
    publishing_status: 'scheduled',
    t_minus_days: 2
  },
  {
    id: 'post-3',
    calendar_id: 'cal-3',
    client_id: 'client-3',
    client_name: 'Nexus Healthcare',
    platform: 'LinkedIn',
    publishing_date: '2026-11-03',
    publishing_time: '11:00:00',
    content_type: 'Static Image',
    caption: 'Patient privacy in the era of Connected Health: Our zero-compromise encryption standard.',
    hashtags: '#HealthcareSecurity #HIPAACompliance #DigitalHealth #PatientCare',
    creative_asset_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
    designer_id: undefined,
    designer_name: 'Unassigned',
    reviewer_id: 'emp-mgr',
    publisher_employee_id: undefined,
    production_deadline: '2026-11-02T17:00:00Z',
    approval_status: 'approved',
    publishing_status: 'ready_to_publish',
    t_minus_days: 1
  }
];

export const initialWhatsAppConversations: WhatsAppConversation[] = [
  {
    id: 'conv-3',
    phone_number: '+1 415 555 0192',
    contact_name: 'Robert Sterling (ABC Group)',
    contact_type: 'client',
    client_id: 'client-1',
    is_human_takeover: true,
    assigned_agent_id: 'emp-mgr',
    unread_count: 0,
    last_message_at: '2026-11-02T15:20:00Z',
    last_message_preview: 'Thanks Talha, we will review the staging preview today by 5 PM.',
    internal_notes: 'Human takeover enabled. Client requested direct updates from Task Manager.'
  }
];

export const initialWhatsAppMessages: WhatsAppMessage[] = [
  {
    id: 'msg-client-1',
    conversation_id: 'conv-3',
    direction: 'outgoing',
    message_type: 'text',
    body: 'Hello Robert, Task Manager Talha Khan here. The staging preview for ABC Group is available for your review.',
    delivery_status: 'delivered',
    sent_by_ai: false,
    created_at: '2026-11-02T15:00:00Z'
  },
  {
    id: 'msg-client-2',
    conversation_id: 'conv-3',
    direction: 'incoming',
    message_type: 'text',
    body: 'Thanks Talha, we will review the staging preview today by 5 PM.',
    delivery_status: 'delivered',
    sent_by_ai: false,
    created_at: '2026-11-02T15:20:00Z'
  }
];

export const initialReminderPolicies: ReminderPolicy[] = [
  { id: 'pol-1', policy_name: 'New Assignment Alert', description: 'Immediate WhatsApp dispatch when a task is assigned', event_trigger: 'new_assignment', delay_hours: 0, channel: 'whatsapp', is_enabled: true },
  { id: 'pol-2', policy_name: 'Unaccepted 24h Escalation', description: 'Reminder if assignment is not accepted within 24 hours', event_trigger: 'unaccepted_24h', delay_hours: 24, channel: 'whatsapp', is_enabled: true },
  { id: 'pol-3', policy_name: 'Unaccepted 48h Manager Alert', description: 'Escalate to Task Manager if unaccepted after 48 hours', event_trigger: 'unaccepted_48h', delay_hours: 48, channel: 'whatsapp', is_enabled: true },
  { id: 'pol-4', policy_name: 'Daily Morning Digest', description: 'Personalized task summary at 9:00 AM on working days', event_trigger: 'daily_summary', delay_hours: 0, channel: 'whatsapp', is_enabled: true },
  { id: 'pol-5', policy_name: 'Deadline 48h Advance Warning', description: 'Notify employee 2 days before due date', event_trigger: 'deadline_48h', delay_hours: 48, channel: 'whatsapp', is_enabled: true },
  { id: 'pol-6', policy_name: 'Deadline 24h Final Notice', description: 'Final preparation reminder 24 hours before deadline', event_trigger: 'deadline_24h', delay_hours: 24, channel: 'whatsapp', is_enabled: true },
  { id: 'pol-7', policy_name: 'Overdue Alert & Escalation', description: 'Urgent notice to employee and Task Manager when overdue', event_trigger: 'overdue', delay_hours: 0, channel: 'whatsapp', is_enabled: true },
  { id: 'pol-8', policy_name: 'Blocked Task Alert', description: 'Immediate notification to Task Manager when employee reports obstacle', event_trigger: 'blocked_escalation', delay_hours: 0, channel: 'whatsapp', is_enabled: true }
];

export const initialExecutionLogs: AutomationExecutionLog[] = [
  {
    id: 'log-1',
    workflow_name: 'Daily Morning Employee Digest',
    status: 'success',
    records_processed: 5,
    execution_time_ms: 1240,
    details: 'Dispatched personalized morning WhatsApp summaries to 5 active team members.',
    created_at: '2026-11-02T09:00:15Z'
  },
  {
    id: 'log-2',
    workflow_name: 'Three-Day Content Pipeline Engine',
    status: 'success',
    records_processed: 3,
    execution_time_ms: 890,
    details: 'Checked upcoming posts for Nov 3, 4, 5. Generated 1 production task, verified 2 ongoing reviews.',
    created_at: '2026-11-02T08:00:00Z'
  },
  {
    id: 'log-3',
    workflow_name: 'Deadline Escalation Runner',
    status: 'warning',
    records_processed: 1,
    execution_time_ms: 610,
    details: 'Detected 1 overdue task (TSK-2026-005). Dispatched manager alert.',
    created_at: '2026-11-02T10:00:00Z'
  }
];

export const initialAIUsageLogs: AIUsageLog[] = [
  { id: 'ai-1', feature_name: 'task_decomposition', model_name: 'gpt-4o', prompt_tokens: 650, completion_tokens: 380, total_tokens: 1030, estimated_cost_usd: 0.00765, duration_ms: 1850, status: 'success', created_at: '2026-11-02T08:15:00Z' },
  { id: 'ai-2', feature_name: 'employee_recommendation', model_name: 'gpt-4o-mini', prompt_tokens: 420, completion_tokens: 180, total_tokens: 600, estimated_cost_usd: 0.00015, duration_ms: 920, status: 'success', created_at: '2026-11-02T08:16:00Z' },
  { id: 'ai-3', feature_name: 'nlp_intent_parsing', model_name: 'gpt-4o-mini', prompt_tokens: 210, completion_tokens: 95, total_tokens: 305, estimated_cost_usd: 0.00008, duration_ms: 540, status: 'success', created_at: '2026-11-02T09:40:15Z' },
  { id: 'ai-4', feature_name: 'daily_report_summary', model_name: 'gpt-4o', prompt_tokens: 1100, completion_tokens: 450, total_tokens: 1550, estimated_cost_usd: 0.01150, duration_ms: 2200, status: 'success', created_at: '2026-11-02T17:00:00Z' }
];

export const initialAuditLogs: AuditLog[] = [
  { id: 'aud-1', actor_name: 'Talha Khan', action: 'Approved Website Change Request', entity_type: 'website_change', entity_id: 'wcr-2', previous_state: { status: 'Under Review' }, new_state: { status: 'Approved' }, created_at: '2026-11-02T16:30:00Z' },
  { id: 'aud-2', actor_name: 'System Automation', action: 'Logged Employee Blocker', entity_type: 'task', entity_id: 'tsk-5', previous_state: { status: 'in_progress' }, new_state: { status: 'blocked' }, created_at: '2026-11-02T09:41:00Z' },
  { id: 'aud-3', actor_name: 'Talha Khan', action: 'Created Task Assignment', entity_type: 'task', entity_id: 'tsk-4', previous_state: {}, new_state: { priority: 'urgent' }, created_at: '2026-11-02T08:00:00Z' }
];

// ============================================================================
// SINGLETON IN-MEMORY & PERSISTENCE STORE FOR OPERATIONAL WORKSPACE
// ============================================================================

class OperationsDataStore {
  private departments: Department[] = [...initialDepartments];
  private employees: Employee[] = [...initialEmployees];
  private clients: Client[] = [...initialClients];
  private websites: ClientWebsite[] = [...initialClientWebsites];
  private websiteChanges: WebsiteChangeRequest[] = [...initialWebsiteChangeRequests];
  private tasks: Task[] = [...initialTasks];
  private extensionRequests: TaskExtensionRequest[] = [...initialExtensionRequests];
  private calendars: ContentCalendar[] = [...initialContentCalendars];
  private posts: ContentPost[] = [...initialContentPosts];
  private conversations: WhatsAppConversation[] = [...initialWhatsAppConversations];
  private messages: WhatsAppMessage[] = [...initialWhatsAppMessages];
  private reminderPolicies: ReminderPolicy[] = [...initialReminderPolicies];
  private executionLogs: AutomationExecutionLog[] = [...initialExecutionLogs];
  private aiLogs: AIUsageLog[] = [...initialAIUsageLogs];
  private auditLogs: AuditLog[] = [...initialAuditLogs];
  private isWhatsAppListenerActive: boolean = true;

  constructor() {
    this.loadFromDisk();
  }

  private getServerStorage() {
    if (typeof window !== 'undefined') return null;
    try {
      // Dynamic require to prevent client bundlers from resolving fs/path
      const nodeFs = eval('require')('fs');
      const nodePath = eval('require')('path');
      const dataDir = nodePath.join(process.cwd(), 'data');
      const storeFile = nodePath.join(dataDir, 'store.json');
      return { fs: nodeFs, path: nodePath, dataDir, storeFile };
    } catch {
      return null;
    }
  }

  private loadFromDisk() {
    const storage = this.getServerStorage();
    if (!storage) return;

    try {
      if (storage.fs.existsSync(storage.storeFile)) {
        const raw = storage.fs.readFileSync(storage.storeFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.employees) && parsed.employees.length > 0) {
          this.employees = parsed.employees;
        }
        if (Array.isArray(parsed.departments) && parsed.departments.length > 0) {
          this.departments = parsed.departments;
        }
        if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
          this.tasks = parsed.tasks;
        }
        if (Array.isArray(parsed.clients) && parsed.clients.length > 0) {
          this.clients = parsed.clients;
        }
        if (Array.isArray(parsed.websites) && parsed.websites.length > 0) {
          this.websites = parsed.websites;
        }
        if (Array.isArray(parsed.websiteChanges) && parsed.websiteChanges.length > 0) {
          this.websiteChanges = parsed.websiteChanges;
        }
        if (Array.isArray(parsed.conversations) && parsed.conversations.length > 0) {
          this.conversations = parsed.conversations;
        }
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          this.messages = parsed.messages;
        }
        if (typeof parsed.isWhatsAppListenerActive === 'boolean') {
          this.isWhatsAppListenerActive = parsed.isWhatsAppListenerActive;
        }
        console.log('[DataStore] Loaded persistent state successfully from data/store.json');
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.error('[DataStore] Error loading store from disk:', err);
    }
  }

  saveToDisk() {
    const storage = this.getServerStorage();
    if (!storage) return;

    try {
      if (!storage.fs.existsSync(storage.dataDir)) {
        storage.fs.mkdirSync(storage.dataDir, { recursive: true });
      }
      const stateToPersist = {
        employees: this.employees,
        departments: this.departments,
        tasks: this.tasks,
        clients: this.clients,
        websites: this.websites,
        websiteChanges: this.websiteChanges,
        conversations: this.conversations,
        messages: this.messages,
        isWhatsAppListenerActive: this.isWhatsAppListenerActive,
        lastSaved: new Date().toISOString()
      };
      storage.fs.writeFileSync(storage.storeFile, JSON.stringify(stateToPersist, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DataStore] Error saving store to disk:', err);
    }
  }

  // --- Baileys & OpenAI State ---
  private baileysStatus: {
    status: 'connected' | 'connecting' | 'disconnected' | 'qr_ready';
    phoneNumber?: string;
    qrCodeString?: string;
    pairingCode?: string;
    lastConnectedAt?: string;
  } = {
    status: 'qr_ready',
    qrCodeString: '2@ryzels-baileys-session-active-token-v2-xyz',
    pairingCode: 'RYZL-9842',
    phoneNumber: '+923009998877'
  };

  private openAiConfig: {
    apiKey: string;
    model: string;
    status: 'active' | 'not_configured';
  } = {
    apiKey: 'sk-proj-ryzels-ops-key-saved',
    model: 'gpt-4o-mini',
    status: 'active'
  };

  getBaileysStatus() { return this.baileysStatus; }
  setBaileysStatus(status: 'connected' | 'connecting' | 'disconnected' | 'qr_ready', phone?: string) {
    this.baileysStatus.status = status;
    if (phone) this.baileysStatus.phoneNumber = phone;
    if (status === 'connected') {
      this.baileysStatus.lastConnectedAt = new Date().toISOString();
    }
  }

  isWhatsAppListenerEnabled(): boolean {
    return this.isWhatsAppListenerActive;
  }

  setWhatsAppListenerEnabled(enabled: boolean): boolean {
    this.isWhatsAppListenerActive = enabled;
    this.saveToDisk();
    this.logAudit(
      enabled ? 'Manager Enabled WhatsApp Auto-Processing System' : 'Manager Disabled WhatsApp Auto-Processing System',
      'system_setting',
      'whatsapp_listener',
      { previous: !enabled },
      { enabled }
    );
    return this.isWhatsAppListenerActive;
  }

  getOpenAiConfig() { return this.openAiConfig; }
  setOpenAiConfig(apiKey: string, model: string) {
    this.openAiConfig.apiKey = apiKey;
    this.openAiConfig.model = model;
    this.openAiConfig.status = apiKey ? 'active' : 'not_configured';
    this.logAudit('Updated OpenAI API Key & Model Configuration', 'system_setting', 'openai_config', {}, { model });
  }

  // --- Dynamic Department Management ---
  addDepartment(dept: Omit<Department, 'id' | 'created_at'>): Department {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.departments.push(newDept);
    this.saveToDisk();
    this.logAudit('Created Department', 'department', newDept.id, {}, newDept);
    return newDept;
  }

  updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const dept = this.departments.find(d => d.id === id);
    if (!dept) return null;
    const prev = { ...dept };
    Object.assign(dept, updates);
    this.saveToDisk();
    this.logAudit('Updated Department', 'department', id, prev, dept);
    return dept;
  }

  deleteDepartment(id: string): boolean {
    const idx = this.departments.findIndex(d => d.id === id);
    if (idx !== -1) {
      const removed = this.departments.splice(idx, 1)[0];
      this.saveToDisk();
      this.logAudit('Deleted Department', 'department', id, removed, {});
      return true;
    }
    return false;
  }

  // --- Dynamic Employee Management ---
  addEmployee(emp: Omit<Employee, 'id'>): Employee {
    const newEmp: Employee = {
      ...emp,
      id: `emp-${Date.now()}`
    };
    this.employees.push(newEmp);

    // Create a WhatsApp conversation thread automatically for the new employee
    this.conversations.push({
      id: `conv-${Date.now()}`,
      phone_number: newEmp.phone_number,
      contact_name: newEmp.full_name,
      contact_type: 'employee',
      employee_id: newEmp.id,
      is_human_takeover: false,
      unread_count: 0,
      last_message_at: new Date().toISOString(),
      last_message_preview: `Employee profile registered. Ready for WhatsApp reminders.`
    });

    this.saveToDisk();
    this.logAudit('Added New Team Member', 'employee', newEmp.id, {}, newEmp);
    return newEmp;
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const emp = this.employees.find(e => e.id === id);
    if (!emp) return null;
    const prev = { ...emp };
    Object.assign(emp, updates);

    // Synchronize WhatsApp conversation thread if phone number or name updated
    if (updates.phone_number || updates.full_name) {
      const conv = this.conversations.find(c => c.employee_id === id);
      if (conv) {
        if (updates.phone_number) conv.phone_number = updates.phone_number;
        if (updates.full_name) conv.contact_name = updates.full_name;
      }
    }

    this.saveToDisk();
    this.logAudit('Updated Employee Profile & Department Connection', 'employee', id, prev, emp);
    return emp;
  }

  deleteEmployee(id: string): boolean {
    const idx = this.employees.findIndex(e => e.id === id);
    if (idx !== -1) {
      const removed = this.employees.splice(idx, 1)[0];
      this.saveToDisk();
      this.logAudit('Removed Team Member', 'employee', id, removed, {});
      return true;
    }
    return false;
  }

  deleteTask(id: string): boolean {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      const removed = this.tasks.splice(idx, 1)[0];
      this.saveToDisk();
      this.logAudit('Deleted Task', 'task', id, removed, {});
      return true;
    }
    return false;
  }

  toggleTaskComplete(id: string): Task | null {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return null;
    const isCompleted = task.status === 'completed';
    task.status = isCompleted ? 'in_progress' : 'completed';
    task.updated_at = new Date().toISOString();
    if (!isCompleted) task.completed_at = new Date().toISOString();
    this.saveToDisk();
    return task;
  }

  // --- Read Methods ---
  getDepartments() { return this.departments; }
  getEmployees() { return this.employees; }
  getClients() { return this.clients; }
  getWebsites(clientId?: string) {
    if (clientId) {
      return this.websites.filter(w => w.client_id === clientId);
    }
    return this.websites;
  }
  getWebsiteById(id: string) { return this.websites.find(w => w.id === id); }
  getWebsiteChanges(websiteId?: string) {
    if (websiteId) {
      return this.websiteChanges.filter(c => c.website_id === websiteId);
    }
    return this.websiteChanges;
  }
  getTasks() { return this.tasks; }
  getTaskById(id: string) { return this.tasks.find(t => t.id === id); }
  getExtensionRequests() { return this.extensionRequests; }
  getCalendars() { return this.calendars; }
  getContentPosts(calendarId?: string) {
    if (calendarId) {
      return this.posts.filter(p => p.calendar_id === calendarId);
    }
    return this.posts;
  }
  getConversations() { return this.conversations; }
  getMessages(conversationId: string) {
    return this.messages.filter(m => m.conversation_id === conversationId);
  }
  getReminderPolicies() { return this.reminderPolicies; }
  getExecutionLogs() { return this.executionLogs; }
  getAILogs() { return this.aiLogs; }
  getAuditLogs() { return this.auditLogs; }

  // --- Write & Mutation Methods ---
  addClient(client: Omit<Client, 'id' | 'created_at'>): Client {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      created_at: new Date().toISOString(),
      websites_count: 0
    };
    this.clients.unshift(newClient);
    this.logAudit('Created Client', 'client', newClient.id, {}, newClient);
    return newClient;
  }

  addWebsite(website: Omit<ClientWebsite, 'id' | 'created_at'>): ClientWebsite {
    const newWeb: ClientWebsite = {
      ...website,
      id: `web-${Date.now()}`,
      created_at: new Date().toISOString(),
      pending_changes_count: 0,
      active_tasks_count: 0
    };
    this.websites.unshift(newWeb);
    const client = this.clients.find(c => c.id === newWeb.client_id);
    if (client) {
      client.websites_count = (client.websites_count || 0) + 1;
    }
    this.logAudit('Created Client Website', 'client_website', newWeb.id, {}, newWeb);
    return newWeb;
  }

  addWebsiteChange(change: Omit<WebsiteChangeRequest, 'id' | 'change_request_code' | 'created_at' | 'updated_at'>): WebsiteChangeRequest {
    const code = `WCR-2026-${String(this.websiteChanges.length + 1).padStart(3, '0')}`;
    const newChange: WebsiteChangeRequest = {
      ...change,
      id: `wcr-${Date.now()}`,
      change_request_code: code,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.websiteChanges.unshift(newChange);
    this.logAudit('Submitted Website Change Request', 'website_change', newChange.id, {}, newChange);
    return newChange;
  }

  updateWebsiteChangeStatus(id: string, newStatus: WebsiteChangeRequest['current_status'], notes?: string): WebsiteChangeRequest | null {
    const item = this.websiteChanges.find(c => c.id === id);
    if (!item) return null;
    const oldStatus = item.current_status;
    item.current_status = newStatus;
    item.updated_at = new Date().toISOString();
    if (notes) item.completion_notes = notes;
    if (newStatus === 'Completed') item.completed_at = new Date().toISOString();

    this.logAudit('Updated Change Request Status', 'website_change', id, { status: oldStatus }, { status: newStatus, notes });
    return item;
  }

  addTask(task: Omit<Task, 'id' | 'task_code' | 'created_at' | 'updated_at' | 'actual_hours'>): Task {
    const code = `TSK-2026-${String(this.tasks.length + 1).padStart(3, '0')}`;
    const assignedEmp = task.assigned_employee_id 
      ? this.employees.find(e => e.id === task.assigned_employee_id)
      : undefined;

    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}`,
      task_code: code,
      assigned_employee_name: task.assigned_employee_name || assignedEmp?.full_name,
      actual_hours: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.tasks.unshift(newTask);

    // Adjust employee workload
    if (newTask.assigned_employee_id && assignedEmp) {
      assignedEmp.current_workload_hours += newTask.estimated_hours;
    }

    this.logAudit('Created & Assigned Task', 'task', newTask.id, {}, newTask);
    this.saveToDisk();
    return newTask;
  }

  updateTaskStatus(taskId: string, status: Task['status']): Task | null {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return null;
    const prevStatus = task.status;
    task.status = status;
    task.updated_at = new Date().toISOString();
    if (status === 'accepted') task.accepted_at = new Date().toISOString();
    if (status === 'completed') task.completed_at = new Date().toISOString();

    this.logAudit('Updated Task Status', 'task', taskId, { status: prevStatus }, { status });
    this.saveToDisk();
    return task;
  }

  updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return null;
    const prev = { ...task };
    Object.assign(task, updates, { updated_at: new Date().toISOString() });
    if (updates.status === 'completed' && !task.completed_at) {
      task.completed_at = new Date().toISOString();
    }
    this.saveToDisk();
    this.logAudit('Updated Task Details', 'task', taskId, prev, task);
    return task;
  }

  recordEmployeeWhatsAppReply(phoneNumber: string, text: string): { task?: Task; actionTaken: string } {
    // 1. Resolve phone number from WhatsApp Multi-Device LID or JID
    const resolvedNumber = resolvePhoneFromJidOrNumber(phoneNumber);
    const { full: senderClean, last9: senderLast9 } = normalizePhoneNumber(resolvedNumber);

    // 2. Strictly find the employee matching this phone number
    const emp = this.employees.find(e => {
      const { full: eClean, last9: eLast9 } = normalizePhoneNumber(e.phone_number);
      return eClean === senderClean || (senderLast9.length >= 7 && eClean.endsWith(senderLast9)) || (eClean.length >= 7 && senderClean.endsWith(eLast9));
    });

    // ABSOLUTE STRICT RULE: If phone does not match a registered employee, DO NOT TOUCH ANY TASK!
    if (!emp) {
      console.warn(`[dataStore] Ignored WhatsApp message: "${text}" - phone ${phoneNumber} (resolved: ${resolvedNumber}) does not belong to any employee.`);
      return { actionTaken: `Ignored: Sender ${phoneNumber} (${resolvedNumber}) does not match any registered employee.` };
    }

    // 3. Find target task STRICTLY belonging to THIS verified employee
    const empTasks = this.tasks.filter(t => 
      t.assigned_employee_id === emp.id || 
      (t.assigned_employee_name && t.assigned_employee_name.toLowerCase().trim() === emp.full_name.toLowerCase().trim())
    );

    if (empTasks.length === 0) {
      console.warn(`[dataStore] Employee ${emp.full_name} (${emp.phone_number}) replied, but has no tasks assigned.`);
      return { actionTaken: `Employee ${emp.full_name} has no tasks in the Operations Sheet.` };
    }

    // Sort employee's tasks by reminder timestamp (newest reminder first)
    const sortedByReminder = [...empTasks].sort((a, b) => {
      const timeA = a.last_reminder_sent_at ? new Date(a.last_reminder_sent_at).getTime() : 0;
      const timeB = b.last_reminder_sent_at ? new Date(b.last_reminder_sent_at).getTime() : 0;
      return timeB - timeA;
    });

    // 1) First preference: Employee's task that received a reminder in the last 12 hours
    const recentReminderTask = sortedByReminder.find(t => 
      t.last_reminder_sent_at && 
      (Date.now() - new Date(t.last_reminder_sent_at).getTime() < 12 * 60 * 60 * 1000)
    );

    // 2) Second preference: Employee's active (non-completed) task
    const activeTask = sortedByReminder.find(t => t.status !== 'completed' && t.status !== 'cancelled');

    // 3) Fallback: Most recent task belonging STRICTLY to THIS employee
    const targetTask = recentReminderTask || activeTask || sortedByReminder[0];

    if (!targetTask) {
      return { actionTaken: `No task found for employee ${emp.full_name}.` };
    }

    const lower = text.toLowerCase().trim();
    let updatedStatus = targetTask.status;

    // Detect status from employee's WhatsApp reply (handles single words, numbers, or phrases)
    if (
      lower.includes('completed') || 
      lower.includes('complete') || 
      lower.includes('done') || 
      lower.includes('finished') || 
      lower.includes('finish') ||
      lower.includes('ho gaya') ||
      lower.includes('kar diya') ||
      lower === '1' ||
      lower.startsWith('1.') ||
      lower.startsWith('1 ') ||
      lower.includes('all done')
    ) {
      updatedStatus = 'completed';
      targetTask.completed_at = new Date().toISOString();
    } else if (
      lower.includes('in progress') || 
      lower.includes('inprogress') || 
      lower.includes('in process') || 
      lower.includes('working') || 
      lower.includes('started') || 
      lower.includes('doing') || 
      lower.includes('kar raha') ||
      lower.includes('progress') ||
      lower === '2' ||
      lower.startsWith('2.') ||
      lower.startsWith('2 ')
    ) {
      updatedStatus = 'in_progress';
    } else if (
      lower.includes('blocked') || 
      lower.includes('stuck') || 
      lower.includes('issue') || 
      lower.includes('problem') || 
      lower.includes('delay') ||
      lower.includes('ruka') ||
      lower === '3' ||
      lower.startsWith('3.') ||
      lower.startsWith('3 ') ||
      lower.includes('help')
    ) {
      updatedStatus = 'blocked';
    } else if (lower.includes('accepted') || lower.includes('ok') || lower.includes('got it') || lower.includes('ji sir')) {
      if (targetTask.status === 'assigned' || targetTask.status === 'pending_assignment') {
        updatedStatus = 'in_progress';
      }
    }

    targetTask.status = updatedStatus;
    const cleanRemarks = text.replace(/(Thank you! Remarks:\s*)+/gi, '').trim();
    const newRemark = cleanRemarks || text;

    if (newRemark) {
      if (!targetTask.employee_remarks_history) {
        targetTask.employee_remarks_history = [];
        if (targetTask.employee_remarks && targetTask.employee_remarks.trim()) {
          targetTask.employee_remarks.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed) {
              targetTask.employee_remarks_history!.push({
                message: trimmed,
                timestamp: targetTask.updated_at || new Date().toISOString()
              });
            }
          });
        }
      }

      // Append new message to history while preventing rapid identical duplicate posts
      const lastEntry = targetTask.employee_remarks_history[targetTask.employee_remarks_history.length - 1];
      if (!lastEntry || lastEntry.message !== newRemark) {
        targetTask.employee_remarks_history.push({
          message: newRemark,
          timestamp: new Date().toISOString()
        });
      }

      // Preserve all remarks in order
      targetTask.employee_remarks = targetTask.employee_remarks_history.map(h => h.message).join('\n');
    }

    targetTask.updated_at = new Date().toISOString();

    this.saveToDisk();
    this.logAudit(
      'Recorded Employee WhatsApp Reply & Remarks',
      'task',
      targetTask.id,
      { employee: emp ? emp.full_name : (targetTask.assigned_employee_name || 'Team Member'), previous_status: targetTask.status },
      { status: updatedStatus, employee_remarks: text }
    );

    return {
      task: targetTask,
      actionTaken: `Updated task ${targetTask.task_code} (${targetTask.title}) to "${updatedStatus}" with employee remarks: "${text}"`
    };
  }

  resolveExtensionRequest(requestId: string, approve: boolean, notes: string): TaskExtensionRequest | null {
    const req = this.extensionRequests.find(r => r.id === requestId);
    if (!req) return null;
    req.status = approve ? 'approved' : 'rejected';
    req.decision_notes = notes;

    if (approve) {
      const task = this.tasks.find(t => t.id === req.task_id);
      if (task) {
        task.deadline = req.requested_deadline;
        if (task.status === 'blocked') {
          task.status = 'in_progress';
        }
      }
    }

    this.logAudit(approve ? 'Approved Deadline Extension' : 'Rejected Deadline Extension', 'extension_request', requestId, {}, { approved: approve, notes });
    this.saveToDisk();
    return req;
  }

  toggleHumanTakeover(conversationId: string, takeover: boolean) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.is_human_takeover = takeover;
      this.saveToDisk();
      this.logAudit(takeover ? 'Human Took Over Conversation' : 'Returned Control to AI', 'whatsapp_conversation', conversationId, { is_human_takeover: !takeover }, { is_human_takeover: takeover });
    }
  }

  sendWhatsAppMessage(conversationId: string, body: string, isAi = false): WhatsAppMessage {
    const newMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      direction: 'outgoing',
      message_type: 'text',
      body,
      delivery_status: 'delivered',
      sent_by_ai: isAi,
      created_at: new Date().toISOString()
    };
    this.messages.push(newMsg);

    const conv = this.conversations.find(c => c.id === conversationId);
    if (conv) {
      conv.last_message_at = newMsg.created_at;
      conv.last_message_preview = body;
    }
    this.saveToDisk();
    return newMsg;
  }

  simulateIncomingWhatsApp(phoneNumber: string, body: string): { message: WhatsAppMessage; actionTaken: string } {
    const resolvedNumber = resolvePhoneFromJidOrNumber(phoneNumber);
    const { full: senderClean, last9: senderLast9 } = normalizePhoneNumber(resolvedNumber);
    const formattedPhone = `+${senderClean}`;

    const emp = this.employees.find(e => {
      const { full: eClean, last9: eLast9 } = normalizePhoneNumber(e.phone_number);
      return eClean === senderClean || (senderLast9.length >= 7 && eClean.endsWith(senderLast9)) || (eClean.length >= 7 && senderClean.endsWith(eLast9));
    });

    let conv = this.conversations.find(c => {
      const { full: cClean, last9: cLast9 } = normalizePhoneNumber(c.phone_number);
      return cClean === senderClean || (senderLast9.length >= 7 && cClean.endsWith(senderLast9));
    });

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        phone_number: formattedPhone,
        contact_name: emp ? emp.full_name : 'Unknown Contact',
        contact_type: emp ? 'employee' : 'client',
        is_human_takeover: false,
        unread_count: 1,
        last_message_at: new Date().toISOString(),
        last_message_preview: body
      };
      this.conversations.unshift(conv);
    } else {
      if (emp && (conv.contact_name === 'Unknown Contact' || !conv.contact_name)) {
        conv.contact_name = emp.full_name;
      }
      conv.phone_number = formattedPhone;
      conv.unread_count += 1;
      conv.last_message_at = new Date().toISOString();
      conv.last_message_preview = body;
    }

    const inMsg: WhatsAppMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: conv.id,
      direction: 'incoming',
      message_type: 'text',
      body,
      delivery_status: 'read',
      sent_by_ai: false,
      created_at: new Date().toISOString()
    };
    this.messages.push(inMsg);

    // Natural Language Processing Logic
    const lower = body.toLowerCase();
    let actionTaken = 'Logged message';

    // Check for acceptance
    if (lower.includes('accept') || lower.includes('i will do it') || lower.includes('on it')) {
      if (emp) {
        const pendingTask = this.tasks.find(t => t.assigned_employee_id === emp.id && t.status === 'assigned');
        if (pendingTask) {
          pendingTask.status = 'accepted';
          pendingTask.accepted_at = new Date().toISOString();
          actionTaken = `Task ${pendingTask.task_code} accepted by ${emp.full_name}`;
          this.logAudit('Employee Accepted Task via WhatsApp', 'task', pendingTask.id, { status: 'assigned' }, { status: 'accepted' });
        }
      }
    }
    // Check for extension request
    else if (lower.includes('more day') || lower.includes('need extension') || lower.includes('delay') || lower.includes('tomorrow')) {
      if (emp) {
        const currentTask = this.tasks.find(t => t.assigned_employee_id === emp.id && (t.status === 'in_progress' || t.status === 'assigned'));
        if (currentTask) {
          const req: TaskExtensionRequest = {
            id: `ext-${Date.now()}`,
            task_id: currentTask.id,
            task_title: currentTask.title,
            employee_id: emp.id,
            employee_name: emp.full_name,
            original_deadline: currentTask.deadline,
            requested_deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
            reason: `Requested via WhatsApp message: "${body}"`,
            status: 'pending',
            created_at: new Date().toISOString()
          };
          this.extensionRequests.unshift(req);
          actionTaken = `Logged extension request for ${currentTask.task_code}`;
          this.logAudit('Extension Requested via WhatsApp', 'extension_request', req.id, {}, req);
        }
      }
    }
    // Check for blocker
    else if (lower.includes('problem') || lower.includes('block') || lower.includes('issue') || lower.includes('help')) {
      if (emp) {
        const currentTask = this.tasks.find(t => t.assigned_employee_id === emp.id && t.status === 'in_progress');
        if (currentTask) {
          currentTask.status = 'blocked';
          actionTaken = `Marked ${currentTask.task_code} as blocked and alerted manager`;
          this.logAudit('Task Blocked via WhatsApp Alert', 'task', currentTask.id, { status: 'in_progress' }, { status: 'blocked' });
        }
      }
    }
    // Check for completion
    else if (lower.includes('complete') || lower.includes('done') || lower.includes('finished') || lower.includes('review')) {
      if (emp) {
        const currentTask = this.tasks.find(t => t.assigned_employee_id === emp.id && (t.status === 'in_progress' || t.status === 'accepted'));
        if (currentTask) {
          currentTask.status = 'under_review';
          actionTaken = `Submitted ${currentTask.task_code} for manager review`;
          this.logAudit('Task Submitted for Review via WhatsApp', 'task', currentTask.id, {}, { status: 'under_review' });
        }
      }
    }

    return { message: inMsg, actionTaken };
  }

  // Deterministic Employee Recommendation Engine
  scoreEmployeesForTask(category: TaskCategory, priority: TaskPriority, requiredDepartmentId?: string): EmployeeRecommendationScore[] {
    return this.employees
      .filter(emp => emp.role === 'employee')
      .map(emp => {
        // 1. Skill Score (0-40)
        let skillScore = 10;
        const matchingSkill = emp.skills?.find(s => s.skill_name.toLowerCase() === category.toLowerCase());
        if (matchingSkill) {
          if (matchingSkill.proficiency_level === 'expert') skillScore = 40;
          else if (matchingSkill.proficiency_level === 'advanced') skillScore = 32;
          else if (matchingSkill.proficiency_level === 'intermediate') skillScore = 24;
          else skillScore = 16;
        }

        // 2. Department Alignment (0-20)
        let deptScore = 10;
        if (requiredDepartmentId && emp.department_id === requiredDepartmentId) {
          deptScore = 20;
        }

        // 3. Workload Balance (0-30)
        const loadRatio = emp.current_workload_hours / emp.max_weekly_capacity_hours;
        let workloadScore = 30;
        let workloadStatus: 'low' | 'optimal' | 'heavy' | 'overloaded' = 'optimal';

        if (loadRatio < 0.5) {
          workloadScore = 30;
          workloadStatus = 'low';
        } else if (loadRatio <= 0.8) {
          workloadScore = 25;
          workloadStatus = 'optimal';
        } else if (loadRatio <= 0.95) {
          workloadScore = 15;
          workloadStatus = 'heavy';
        } else {
          workloadScore = 5;
          workloadStatus = 'overloaded';
        }

        // 4. Availability & Status (0-10)
        let availScore = 10;
        if (emp.status === 'busy') availScore = 4;
        if (emp.status === 'on_leave') availScore = 0;

        const totalScore = skillScore + deptScore + workloadScore + availScore;

        let explanation = `${emp.full_name} has `;
        if (matchingSkill) {
          explanation += `${matchingSkill.proficiency_level} proficiency in ${category}. `;
        } else {
          explanation += `transferable general software engineering experience. `;
        }
        explanation += `Current workload is ${emp.current_workload_hours}h/${emp.max_weekly_capacity_hours}h (${workloadStatus}).`;

        return {
          employee: emp,
          total_score: totalScore,
          skill_score: skillScore,
          workload_score: workloadScore,
          availability_score: availScore,
          history_score: deptScore,
          explanation,
          workload_status: workloadStatus
        };
      })
      .sort((a, b) => b.total_score - a.total_score);
  }

  logAudit(action: string, entity_type: string, entity_id: string, previous_state: Record<string, any>, new_state: Record<string, any>) {
    this.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      actor_name: 'Talha Khan (Task Manager)',
      action,
      entity_type,
      entity_id,
      previous_state,
      new_state,
      created_at: new Date().toISOString()
    });
  }

  logAIUsage(feature: string, model: string, promptTokens: number, completionTokens: number, costUsd: number, durationMs: number) {
    this.aiLogs.unshift({
      id: `ai-${Date.now()}`,
      feature_name: feature,
      model_name: model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      estimated_cost_usd: costUsd,
      duration_ms: durationMs,
      status: 'success',
      created_at: new Date().toISOString()
    });
  }
}

// Global singleton instance
export const dataStore = new OperationsDataStore();
