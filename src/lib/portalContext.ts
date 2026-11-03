import { dataStore } from '@/lib/dataStore';

/**
 * MASTER SYSTEM PROMPT & OPERATIONAL RULES FOR RYZELS TASK MANAGER AI
 * This rulebook governs how the AI understands and manages the entire portal.
 */
export const TASK_MANAGER_OFFICIAL_RULES = `
# RYZELS AI WORKSPACE — TASK MANAGER OPERATIONAL RULES & GOVERNANCE

You are the Senior Operations Control AI for RYZELS AI WORKSPACE, working under the direction of Task Manager **Talha Khan** (Head of Operations).
You assist Talha Khan in overseeing all client projects, multi-website operations, employee workloads, website change requests, and automated WhatsApp communication.

## 1. COMPREHENSIVE PORTAL AWARENESS
You have real-time read and write access to the entire company operations portal:
- Active Projects & Client Profiles (Clients: ABC Group, Apex Global, Urban Living, etc.).
- Multi-Website Registry (Each client may own multiple domains, e.g., abcgroup.com, abcelectronics.com, abcservices.com).
- Departments: Web Development (DEV), UI/UX Design (DESIGN), SEO & Growth (SEO), Content & Social (CONTENT), Operations & QA (OPS).
- Employees & Workload: Track weekly capacity (max 40h/week), current hours, proficiency levels, and availability.
- Tasks: Priority (Urgent, High, Medium, Low), Category, Deadlines, Dependencies, Status (Assigned, Accepted, In Progress, Under Review, Completed, Blocked).
- Website Change Requests: 10-stage governance lifecycle, before/after evidence validation, and manager approvals.
- Content Calendars: Client brand pipelines enforcing a mandatory 3-day production lead-time before publication.
- Manager Approvals: Deadline extensions, scope adjustments, and deliverable sign-offs.

## 2. TASK ASSIGNMENT & DECOMPOSITION RULES
- Multi-Website Isolation: Every website-related task MUST be linked to its specific website domain, not just the parent client.
- Deconstruct Complex Briefs: Break complex briefs into modular sub-tasks with realistic hour estimates and dependencies.
- Deterministic Skill Matching: Recommend employees based on:
  * Skill proficiency (40% weight)
  * Department alignment (20% weight)
  * Workload balance (30% weight: <50% low, 50-80% optimal, 80-95% heavy, >95% overloaded)
  * Availability (10% weight)
- Overload Protection: NEVER assign an employee beyond their 40-hour weekly capacity without explicit manager override.

## 3. WEBSITE CHANGE REQUEST GOVERNANCE
- Strict 10-Stage Lifecycle:
  1. New Request -> 2. Awaiting Clarification -> 3. Approved -> 4. Assigned -> 5. In Progress ->
  6. Under Review -> 7. Changes Required -> 8. Completed -> 9. Rejected -> 10. Cancelled.
- Evidence Requirement: NEVER mark a website change as Completed without:
  * Before-change reference or screenshot.
  * After-change evidence or staging URL.
  * Reviewer sign-off.
- Audit Preservation: Log all state transitions, timestamps, and actors into the immutable audit trail.

## 4. WHATSAPP COMMUNICATION PROTOCOL
- Daily 9:00 AM Employee Digest:
  * Send personalized summary: Greeting, Today's Assigned Tasks, Overdue Tasks, Approaching Deadlines.
  * Only include the recipient's authorized tasks. Never send generic blast messages.
- Automated Follow-Up Rules:
  * New Assignment: Immediate WhatsApp notification.
  * Not Accepted within 24h: Gentle reminder.
  * Still Not Accepted after 48h: Escalate alert to Task Manager.
  * Approaching Deadline (48h & 24h): Send preparation reminder.
  * Blocked Status: Immediately alert Task Manager with blocker reason.
  * Under Review Submission: Notify assigned manager for sign-off.
- Human Takeover Yield: If a manager engages Human Takeover mode on any conversation thread, STOP automated replies immediately until returned to AI mode.

## 5. TONE & RESPONSE FORMAT
- Professional, concise, proactive, and operationally rigorous.
- Format responses cleanly with bullet points, deadlines, and direct action recommendations.
`.trim();

/**
 * Generate a comprehensive real-time site summary from dataStore
 */
export function getLivePortalState() {
  const tasks = dataStore.getTasks();
  const employees = dataStore.getEmployees();
  const clients = dataStore.getClients();
  const websites = dataStore.getWebsites();
  const websiteChanges = dataStore.getWebsiteChanges();
  const calendars = dataStore.getCalendars();
  const extensionRequests = dataStore.getExtensionRequests();
  const auditLogs = dataStore.getAuditLogs();

  const now = new Date();
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.deadline) < now);
  const pendingApprovals = extensionRequests.filter(r => r.status === 'pending');
  const pendingChanges = websiteChanges.filter(c => c.current_status !== 'Completed' && c.current_status !== 'Cancelled');
  
  const totalWorkloadHours = employees.reduce((sum, e) => sum + e.current_workload_hours, 0);
  const totalCapacityHours = employees.reduce((sum, e) => sum + e.max_weekly_capacity_hours, 0);

  return {
    timestamp: now.toISOString(),
    metrics: {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(t => t.status !== 'completed').length,
      overdueTasksCount: overdueTasks.length,
      totalEmployees: employees.length,
      totalClients: clients.length,
      totalWebsites: websites.length,
      pendingWebsiteChangesCount: pendingChanges.length,
      pendingApprovalsCount: pendingApprovals.length,
      teamWorkloadRatio: Math.round((totalWorkloadHours / totalCapacityHours) * 100)
    },
    overdueTasks: overdueTasks.map(t => ({
      code: t.task_code,
      title: t.title,
      assignedTo: t.assigned_employee_name,
      deadline: t.deadline,
      priority: t.priority
    })),
    websites: websites.map(w => ({
      name: w.website_name,
      domain: w.domain,
      platform: w.platform,
      status: w.current_status,
      assignedDev: employees.find(e => e.id === w.responsible_developer_id)?.full_name || 'Unassigned',
      assignedDesigner: employees.find(e => e.id === w.designer_id)?.full_name || 'Unassigned'
    })),
    pendingChanges: pendingChanges.map(c => ({
      id: c.change_request_code,
      title: c.request_title,
      website: c.website_domain || 'Unknown Domain',
      status: c.current_status,
      priority: c.priority,
      assignedTo: employees.find(e => e.id === c.assigned_employee_id)?.full_name || 'Unassigned'
    })),
    employees: employees.map(e => ({
      name: e.full_name,
      position: e.position,
      phone: e.phone_number,
      workload: `${e.current_workload_hours}h / ${e.max_weekly_capacity_hours}h`,
      status: e.status
    })),
    pendingApprovals: pendingApprovals.map(a => ({
      id: a.id,
      task: a.task_title,
      employee: a.employee_name,
      reason: a.reason,
      requestedDeadline: a.requested_deadline
    }))
  };
}

/**
 * Intelligent Portal Query Processor for Baileys WhatsApp Bot
 * Reads live data and returns contextual operational answers.
 */
export function queryPortalWithAi(query: string, senderPhone?: string): {
  answer: string;
  sourceEntities: string[];
  actionTaken?: string;
} {
  const state = getLivePortalState();
  const lower = query.toLowerCase();

  // 1. Employee checking personal tasks
  if (senderPhone || lower.includes('my task') || lower.includes('assigned to me')) {
    const emp = senderPhone 
      ? state.employees.find(e => e.phone === senderPhone)
      : state.employees.find(e => lower.includes(e.name.toLowerCase().split(' ')[0]));

    if (emp) {
      const empTasks = dataStore.getTasks().filter(t => t.assigned_employee_name?.toLowerCase().includes(emp.name.toLowerCase().split(' ')[0]));
      const active = empTasks.filter(t => t.status !== 'completed');

      const answer = `👋 Hello ${emp.name}! Here is your live RYZELS task briefing:\n\n` +
        `📊 Active Tasks: ${active.length} | Workload: ${emp.workload}\n\n` +
        active.map((t, idx) => 
          `${idx + 1}. [${t.priority.toUpperCase()}] ${t.title}\n` +
          `   • Code: ${t.task_code}\n` +
          `   • Status: ${t.status}\n` +
          `   • Deadline: ${new Date(t.deadline).toLocaleDateString()} ${new Date(t.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        ).join('\n\n') +
        `\n\n💬 Reply with "Accepted", "Completed", or "Need extension" to update.`;

      return {
        answer,
        sourceEntities: ['tasks', 'employees']
      };
    }
  }

  // 2. Overdue tasks query
  if (lower.includes('overdue') || lower.includes('late') || lower.includes('missed deadline')) {
    if (state.overdueTasks.length === 0) {
      return {
        answer: `✅ Excellent! There are currently ZERO overdue tasks across all client websites and departments.`,
        sourceEntities: ['tasks']
      };
    }

    const answer = `⚠️ ATTENTION: There are ${state.overdueTasks.length} OVERDUE tasks requiring immediate resolution:\n\n` +
      state.overdueTasks.map((t, i) => 
        `${i + 1}. ${t.code} — ${t.title}\n` +
        `   • Responsible: ${t.assignedTo}\n` +
        `   • Priority: ${t.priority.toUpperCase()}\n` +
        `   • Deadline was: ${new Date(t.deadline).toLocaleDateString()}`
      ).join('\n\n') +
      `\n\nRecommended Action: Reassign or request deadline extension via the Approvals center.`;

    return {
      answer,
      sourceEntities: ['tasks', 'approvals']
    };
  }

  // 3. Website Changes query
  if (lower.includes('change') || lower.includes('website change') || lower.includes('request')) {
    const answer = `🔄 Active Website Change Requests (${state.pendingChanges.length} Pending):\n\n` +
      state.pendingChanges.map((c, i) => 
        `${i + 1}. [${c.id}] ${c.title}\n` +
        `   • Website: ${c.website}\n` +
        `   • Status: ${c.status}\n` +
        `   • Assigned: ${c.assignedTo || 'Unassigned'}\n` +
        `   • Priority: ${c.priority}`
      ).join('\n\n') +
      `\n\nReminder: Changes cannot be marked Completed without before/after evidence check.`;

    return {
      answer,
      sourceEntities: ['website_changes', 'websites']
    };
  }

  // 4. Client Websites query
  if (lower.includes('website') || lower.includes('domain') || lower.includes('abcgroup') || lower.includes('shopify') || lower.includes('wordpress')) {
    const answer = `🌐 Client Websites Overview (${state.websites.length} Registered Properties):\n\n` +
      state.websites.map((w, i) => 
        `${i + 1}. ${w.name} (${w.domain})\n` +
        `   • Platform: ${w.platform} | Status: ${w.status}\n` +
        `   • Dev: ${w.assignedDev} | Designer: ${w.assignedDesigner}`
      ).join('\n\n');

    return {
      answer,
      sourceEntities: ['websites', 'clients', 'employees']
    };
  }

  // 5. Team Workload & Capacity query
  if (lower.includes('team') || lower.includes('workload') || lower.includes('capacity') || lower.includes('available') || lower.includes('who can')) {
    const answer = `👥 Team Workload & Capacity (${state.metrics.teamWorkloadRatio}% overall utilized):\n\n` +
      state.employees.map((e, i) => 
        `${i + 1}. ${e.name} — ${e.position}\n` +
        `   • Hours: ${e.workload} (${e.status})\n` +
        `   • Phone: ${e.phone}`
      ).join('\n\n');

    return {
      answer,
      sourceEntities: ['employees', 'departments']
    };
  }

  // 6. Pending Approvals query
  if (lower.includes('approval') || lower.includes('extension') || lower.includes('pending sign')) {
    if (state.pendingApprovals.length === 0) {
      return {
        answer: `✅ No pending manager approvals or deadline extension requests at this moment.`,
        sourceEntities: ['approvals']
      };
    }

    const answer = `📋 Pending Manager Approvals (${state.pendingApprovals.length}):\n\n` +
      state.pendingApprovals.map((a, i) => 
        `${i + 1}. ${a.task}\n` +
        `   • Requested By: ${a.employee}\n` +
        `   • Reason: ${a.reason}\n` +
        `   • New Date Requested: ${new Date(a.requestedDeadline).toLocaleDateString()}`
      ).join('\n\n') +
      `\n\nGo to http://localhost:3000/approvals to approve or reject with comments.`;

    return {
      answer,
      sourceEntities: ['approvals', 'tasks']
    };
  }

  // Default: General Portal Operations Briefing
  const answer = `🏢 RYZELS AI WORKSPACE — Operations Briefing:\n\n` +
    `• Active Tasks: ${state.metrics.activeTasks} (${state.metrics.overdueTasksCount} overdue)\n` +
    `• Client Websites: ${state.metrics.totalWebsites} across ${state.metrics.totalClients} clients\n` +
    `• Pending Website Changes: ${state.metrics.pendingWebsiteChangesCount}\n` +
    `• Team Workload Capacity: ${state.metrics.teamWorkloadRatio}% utilized\n` +
    `• Pending Approvals: ${state.metrics.pendingApprovalsCount}\n\n` +
    `You can ask specific questions like:\n` +
    `- "Show overdue tasks"\n` +
    `- "What are my assigned tasks?"\n` +
    `- "Pending website changes for abcgroup.com"\n` +
    `- "Show team workload capacity"`;

  return {
    answer,
    sourceEntities: ['tasks', 'websites', 'website_changes', 'employees', 'approvals']
  };
}
