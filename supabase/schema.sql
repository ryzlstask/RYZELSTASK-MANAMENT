-- ==============================================================================
-- RYZELS AI WORKSPACE — ADVANCED OPERATIONS DATABASE SCHEMA
-- PostgreSQL / Supabase Schema Definition
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. DEPARTMENTS & EMPLOYEES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    head_employee_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- References auth.users if Supabase Auth is enabled
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(30) NOT NULL UNIQUE, -- Primary WhatsApp phone
    role VARCHAR(50) NOT NULL DEFAULT 'employee', -- 'admin', 'task_manager', 'team_lead', 'employee', 'reviewer'
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position VARCHAR(100),
    current_workload_hours NUMERIC(6, 2) DEFAULT 0.00,
    max_weekly_capacity_hours NUMERIC(6, 2) DEFAULT 40.00,
    status VARCHAR(30) DEFAULT 'active', -- 'active', 'on_leave', 'busy', 'inactive'
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circular FK for department head
ALTER TABLE departments 
ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_employee_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    years_experience NUMERIC(3, 1) DEFAULT 1.0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, skill_name)
);

CREATE TABLE IF NOT EXISTS employee_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available_hours NUMERIC(4, 2) DEFAULT 8.00,
    status VARCHAR(30) DEFAULT 'available', -- 'available', 'partially_booked', 'fully_booked', 'holiday', 'sick_leave'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS employee_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    daily_reminder_time TIME DEFAULT '09:00:00',
    timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
    quiet_hours_start TIME DEFAULT '21:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    notify_on_assignment BOOLEAN DEFAULT TRUE,
    notify_on_deadline_warning BOOLEAN DEFAULT TRUE,
    notify_on_overdue BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. CLIENTS & MULTI-WEBSITE MANAGEMENT
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    industry VARCHAR(100),
    tier VARCHAR(20) DEFAULT 'standard', -- 'standard', 'premium', 'enterprise'
    status VARCHAR(30) DEFAULT 'active', -- 'active', 'paused', 'terminated'
    monthly_retainer NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    website_name VARCHAR(150) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    website_type VARCHAR(50) DEFAULT 'corporate', -- 'ecommerce', 'corporate', 'blog', 'portfolio', 'landing_page', 'saas'
    platform VARCHAR(50) DEFAULT 'WordPress', -- 'WordPress', 'Shopify', 'Custom Next.js', 'Webflow', 'Magento', 'Other'
    assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    responsible_developer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    seo_responsible_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    designer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    website_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    current_status VARCHAR(30) DEFAULT 'live', -- 'live', 'staging', 'development', 'maintenance', 'inactive'
    hosting_reference TEXT, -- Non-sensitive reference code or provider pointer
    launch_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID NOT NULL REFERENCES client_websites(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'status_change', 'change_request_created', 'deployment', 'seo_audit', 'task_completed'
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. WEBSITE CHANGE REQUEST LIFECYCLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS website_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_code VARCHAR(30) NOT NULL UNIQUE, -- e.g. WCR-2026-001
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    website_id UUID NOT NULL REFERENCES client_websites(id) ON DELETE CASCADE,
    request_title VARCHAR(255) NOT NULL,
    detailed_description TEXT NOT NULL,
    requester VARCHAR(150) NOT NULL,
    assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    deadline TIMESTAMPTZ,
    current_status VARCHAR(30) DEFAULT 'New Request', 
    -- 'New Request', 'Awaiting Clarification', 'Approved', 'Assigned', 'In Progress', 
    -- 'Under Review', 'Changes Required', 'Completed', 'Rejected', 'Cancelled'
    before_change_reference TEXT,
    before_attachment_url TEXT,
    after_evidence_screenshot_url TEXT,
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_change_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_id UUID NOT NULL REFERENCES website_change_requests(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    notes TEXT,
    snapshot_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. ADVANCED TASKS & WORKLOAD
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_code VARCHAR(30) NOT NULL UNIQUE, -- e.g. TSK-2026-0042
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    website_id UUID REFERENCES client_websites(id) ON DELETE SET NULL,
    project_name VARCHAR(150),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, 
    -- 'Website design', 'Frontend development', 'Backend development', 'WordPress development',
    -- 'Shopify development', 'Bug fixing', 'Website maintenance', 'SEO', 'Speed optimization',
    -- 'Content updates', 'Landing page creation', 'Security updates', 'Website migration', 'Other'
    assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(30) DEFAULT 'pending_assignment',
    -- 'pending_assignment', 'proposed_ai', 'assigned', 'accepted', 'in_progress', 
    -- 'under_review', 'changes_requested', 'completed', 'blocked', 'cancelled'
    estimated_hours NUMERIC(6, 2) DEFAULT 4.00,
    actual_hours NUMERIC(6, 2) DEFAULT 0.00,
    deliverables TEXT,
    deadline TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence_score NUMERIC(4, 2),
    ai_explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS task_extension_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    requested_deadline TIMESTAMPTZ NOT NULL,
    original_deadline TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    decision_notes TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_completion_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) DEFAULT 'link', -- 'link', 'screenshot', 'document', 'code_pr'
    evidence_url TEXT NOT NULL,
    notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_task_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    channel VARCHAR(30) DEFAULT 'whatsapp', -- 'whatsapp', 'portal', 'email'
    raw_response TEXT NOT NULL,
    interpreted_intent VARCHAR(50) NOT NULL, -- 'accept', 'extension_request', 'blocker_report', 'completion', 'question'
    parsed_metadata JSONB DEFAULT '{}',
    processed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. CONTENT CALENDARS & 3-DAY PRODUCTION PIPELINE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS content_calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    calendar_name VARCHAR(150) NOT NULL,
    target_month VARCHAR(20) NOT NULL, -- e.g. 'November 2026'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES content_calendars(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'X/Twitter', 'YouTube'
    publishing_date DATE NOT NULL,
    publishing_time TIME DEFAULT '17:00:00',
    content_type VARCHAR(50) DEFAULT 'Carousel', -- 'Static Image', 'Carousel', 'Reels/Shorts', 'Video', 'Article', 'Story'
    caption TEXT,
    hashtags TEXT,
    creative_asset_url TEXT,
    designer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    publisher_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    production_deadline TIMESTAMPTZ,
    approval_status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'pending_production', 'in_review', 'approved', 'rejected'
    publishing_status VARCHAR(30) DEFAULT 'scheduled', -- 'scheduled', 'ready_to_publish', 'published', 'failed'
    published_live_url TEXT,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_content_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    pipeline_stage VARCHAR(30) NOT NULL, -- 'T_MINUS_3', 'T_MINUS_2', 'T_MINUS_1', 'PUBLISH_DAY'
    scheduled_for DATE NOT NULL,
    executed_at TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'executed', 'skipped', 'failed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. WHATSAPP ENGINE & CONVERSATION INBOX
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(30) NOT NULL UNIQUE,
    contact_name VARCHAR(150),
    contact_type VARCHAR(20) DEFAULT 'employee', -- 'employee', 'client', 'other'
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    is_human_takeover BOOLEAN DEFAULT FALSE,
    assigned_agent_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    unread_count INT DEFAULT 0,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL, -- 'incoming', 'outgoing'
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'template', 'image', 'document'
    body TEXT NOT NULL,
    media_url TEXT,
    template_name VARCHAR(100),
    delivery_status VARCHAR(20) DEFAULT 'sent', -- 'queued', 'sent', 'delivered', 'read', 'failed'
    error_message TEXT,
    wa_message_id VARCHAR(100),
    sent_by_ai BOOLEAN DEFAULT FALSE,
    sent_by_user_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_key VARCHAR(100) NOT NULL UNIQUE,
    template_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'daily_digest', 'assignment_alert', 'deadline_warning', 'overdue_escalation', 'content_reminder'
    body_text TEXT NOT NULL,
    placeholders JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. REMINDERS, AUTOMATIONS & RETRY QUEUE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reminder_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    event_trigger VARCHAR(50) NOT NULL,
    -- 'new_assignment', 'unaccepted_24h', 'unaccepted_48h', 'daily_summary',
    -- 'deadline_48h', 'deadline_24h', 'overdue', 'blocked_escalation', 'submission_review'
    delay_hours INT DEFAULT 0,
    channel VARCHAR(30) DEFAULT 'whatsapp',
    is_enabled BOOLEAN DEFAULT TRUE,
    template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminder_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key VARCHAR(150) NOT NULL UNIQUE,
    policy_id UUID REFERENCES reminder_policies(id) ON DELETE SET NULL,
    target_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'sent', 'cancelled', 'failed'
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reminder_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES reminder_jobs(id) ON DELETE SET NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL, -- 'success', 'failed', 'quiet_hours_delayed'
    payload TEXT NOT NULL,
    response_data JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name VARCHAR(100) NOT NULL, -- e.g. 'daily_employee_digest_cron', 'three_day_content_pipeline'
    status VARCHAR(20) NOT NULL, -- 'success', 'warning', 'failed'
    records_processed INT DEFAULT 0,
    execution_time_ms INT DEFAULT 0,
    details TEXT,
    error_stack TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_retry_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    next_retry_at TIMESTAMPTZ NOT NULL,
    last_error TEXT,
    status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'processing', 'resolved', 'abandoned'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. AI USAGE, COSTS & COMPREHENSIVE AUDIT TRAIL
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name VARCHAR(100) NOT NULL, -- 'task_decomposition', 'employee_recommendation', 'nlp_intent_parsing', 'daily_report_summary'
    model_name VARCHAR(50) NOT NULL, -- 'gpt-4o-mini', 'gpt-4o'
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(8, 6) DEFAULT 0.000000,
    duration_ms INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'rate_limited', 'failed'
    user_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_cost_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_date DATE NOT NULL UNIQUE,
    daily_request_count INT DEFAULT 0,
    daily_token_count INT DEFAULT 0,
    daily_cost_usd NUMERIC(10, 4) DEFAULT 0.0000,
    budget_limit_usd NUMERIC(10, 4) DEFAULT 50.0000,
    alert_triggered BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'ai_proposal_approved', 'extension_granted', 'task_completed', 'website_change_approved'
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'website_change', 'extension_request', 'post'
    entity_id VARCHAR(100) NOT NULL,
    previous_state JSONB DEFAULT '{}',
    new_state JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_client_websites_client_id ON client_websites(client_id);
CREATE INDEX IF NOT EXISTS idx_website_changes_website_id ON website_change_requests(website_id);
CREATE INDEX IF NOT EXISTS idx_website_changes_status ON website_change_requests(current_status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_emp ON tasks(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_website_id ON tasks(website_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_content_posts_date ON content_posts(publishing_date);
CREATE INDEX IF NOT EXISTS idx_content_posts_client ON content_posts(client_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_conv ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reminder_jobs_sched ON reminder_jobs(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

