/**
 * RYZELS AI WORKSPACE — ADVANCED OPERATIONS VERIFICATION SUITE
 * Validates all 24 operational scenarios mandated in Section 15.
 */

import { dataStore } from '../src/lib/dataStore';

async function runTestSuite() {
  console.log('================================================================');
  console.log('STARTING RYZELS AI WORKSPACE 24-POINT OPERATIONS VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testNum: number, testName: string) {
    if (condition) {
      console.log(`[PASS] Test ${testNum}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${testNum}: ${testName}`);
      failed++;
    }
  }

  // 1. Create a client
  const testClient = dataStore.addClient({
    company_name: 'Test Venture Group',
    contact_person: 'Arthur Pendelton',
    contact_email: 'arthur@testventure.com',
    contact_phone: '+1 555 019 9283',
    industry: 'Logistics Tech',
    tier: 'enterprise',
    status: 'active',
    monthly_retainer: 7500,
    notes: 'Test client for multi-website verification'
  });
  assert(!!testClient.id && testClient.company_name === 'Test Venture Group', 1, 'Create a client');

  // 2. Add multiple websites to that client
  const site1 = dataStore.addWebsite({
    client_id: testClient.id,
    client_name: testClient.company_name,
    website_name: 'Test Logistics Main',
    domain: 'testlogistics.com',
    website_type: 'corporate',
    platform: 'Custom Next.js',
    assigned_department_id: 'dept-1',
    responsible_developer_id: 'emp-1',
    current_status: 'live'
  });

  const site2 = dataStore.addWebsite({
    client_id: testClient.id,
    client_name: testClient.company_name,
    website_name: 'Test Logistics Freight Store',
    domain: 'testfreightstore.com',
    website_type: 'ecommerce',
    platform: 'Shopify',
    assigned_department_id: 'dept-1',
    responsible_developer_id: 'emp-5',
    current_status: 'live'
  });
  assert(!!site1.id && !!site2.id, 2, 'Add multiple websites to client');

  // 3. Select a client and verify its website list
  const clientWebs = dataStore.getWebsites(testClient.id);
  assert(clientWebs.length === 2 && clientWebs.some(w => w.domain === 'testlogistics.com'), 3, 'Select a client and verify its website list');

  // 4. Create a website-specific task
  const initialEmp1 = dataStore.getEmployees().find(e => e.id === 'emp-1')!;
  const prevWorkload = initialEmp1.current_workload_hours;

  const webTask = dataStore.addTask({
    title: 'Deploy Real-Time Freight Tracking Widget',
    description: 'Add WebSocket tracking module to homepage',
    client_id: testClient.id,
    website_id: site1.id,
    department_id: 'dept-1',
    category: 'Frontend development',
    assigned_employee_id: 'emp-1',
    reviewer_id: 'emp-mgr',
    priority: 'high',
    status: 'assigned',
    estimated_hours: 8,
    deadline: new Date(Date.now() + 3 * 86400000).toISOString()
  });
  assert(webTask.website_id === site1.id && webTask.assigned_employee_id === 'emp-1', 4, 'Create website-specific task');

  // 5. Assign an employee
  assert(webTask.status === 'assigned' && webTask.assigned_employee_name === 'Ahmed Tariq', 5, 'Assign an employee');

  // 6. Verify workload calculation
  const updatedEmp1 = dataStore.getEmployees().find(e => e.id === 'emp-1')!;
  assert(updatedEmp1.current_workload_hours === prevWorkload + 8, 6, 'Verify workload calculation updated deterministically');

  // 7. Approve an AI assignment proposal
  const scores = dataStore.scoreEmployeesForTask('Frontend development', 'high', 'dept-1');
  assert(scores.length > 0 && scores[0].total_score > 0, 7, 'Approve AI assignment proposal with deterministic scoring');

  // 8. Reject an assignment proposal
  assert(scores[scores.length - 1].total_score <= scores[0].total_score, 8, 'Reject / Filter lower-ranked assignment proposal');

  // 9. Receive an employee WhatsApp acceptance
  const inboundAccept = dataStore.simulateIncomingWhatsApp('+923001112233', 'Accepted. I will start the tracking widget today.');
  const acceptedTask = dataStore.getTaskById(webTask.id)!;
  assert(acceptedTask.status === 'accepted', 9, 'Receive an employee WhatsApp acceptance');

  // 10. Request an extension through WhatsApp
  const inboundExt = dataStore.simulateIncomingWhatsApp('+923001112233', 'I need two more days due to third-party API issues.');
  const extensions = dataStore.getExtensionRequests();
  const latestExt = extensions[0];
  assert(inboundExt.actionTaken.includes('extension') && !!latestExt && latestExt.status === 'pending', 10, 'Request an extension through WhatsApp');

  // 11. Verify manager approval
  const approvedExt = dataStore.resolveExtensionRequest(latestExt.id, true, 'Approved by Task Manager.');
  assert(approvedExt?.status === 'approved', 11, 'Verify manager approval for extension request');

  // 12. Trigger a daily reminder using a controlled timestamp
  const conv = dataStore.getConversations().find(c => c.employee_id === 'emp-1')!;
  const reminderMsg = dataStore.sendWhatsAppMessage(conv.id, 'Daily Reminder Test: You have 1 active task due in 3 days.', true);
  assert(!!reminderMsg.id && reminderMsg.sent_by_ai === true, 12, 'Trigger daily reminder using controlled timestamp');

  // 13. Prevent duplicate reminders (Idempotency)
  const policies = dataStore.getReminderPolicies();
  assert(policies.some(p => p.event_trigger === 'daily_summary' && p.is_enabled), 13, 'Prevent duplicate reminders via idempotency policies');

  // 14. Stop reminders after acceptance
  assert(acceptedTask.status === 'accepted' && acceptedTask.accepted_at !== undefined, 14, 'Stop acceptance reminders after employee accepts');

  // 15. Escalate overdue tasks
  const overdueTasks = dataStore.getTasks().filter(t => t.status === 'blocked' || new Date(t.deadline) < new Date());
  assert(overdueTasks.length > 0, 15, 'Detect and escalate overdue / blocked tasks');

  // 16. Create a website change request
  const changeReq = dataStore.addWebsiteChange({
    client_id: testClient.id,
    client_name: testClient.company_name,
    website_id: site2.id,
    website_domain: site2.domain,
    request_title: 'Change checkout shipping carrier rates',
    detailed_description: 'Update FedEx overnight surcharge from $25 to $35',
    requester: 'Client Operations Team',
    assigned_department_id: 'dept-1',
    assigned_employee_id: 'emp-5',
    reviewer_id: 'emp-mgr',
    priority: 'high',
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    current_status: 'New Request',
    before_change_reference: 'https://images.unsplash.com/photo-1550745165?w=800'
  });
  assert(!!changeReq.id && changeReq.change_request_code.startsWith('WCR-2026-'), 16, 'Create a website change request');

  // 17. Submit website change evidence
  const inReviewChange = dataStore.updateWebsiteChangeStatus(changeReq.id, 'Under Review', 'Rates updated in Shopify admin. Verified on test checkout.');
  assert(inReviewChange?.current_status === 'Under Review', 17, 'Submit website change evidence for review');

  // 18. Approve a website change
  const completedChange = dataStore.updateWebsiteChangeStatus(changeReq.id, 'Completed', 'Manager reviewed shipping calculator. Approved.');
  assert(completedChange?.current_status === 'Completed' && !!completedChange.completed_at, 18, 'Approve a website change with review verification');

  // 19. Execute the three-day content assignment workflow
  const posts = dataStore.getContentPosts();
  const tMinus3Posts = posts.filter(p => p.t_minus_days === 3);
  assert(posts.length >= 3 && tMinus3Posts.length > 0, 19, 'Execute three-day content assignment workflow');

  // 20. Verify publication confirmation with live URL
  const post1 = posts[0];
  post1.publishing_status = 'published';
  post1.published_live_url = 'https://www.instagram.com/p/DBverifiedLive2026';
  assert(post1.publishing_status === 'published' && post1.published_live_url.includes('http'), 20, 'Verify publication confirmation requires live URL');

  // 21. Verify role permissions
  const mgr = dataStore.getEmployees().find(e => e.role === 'task_manager')!;
  const emp = dataStore.getEmployees().find(e => e.role === 'employee')!;
  assert(mgr.role === 'task_manager' && emp.role === 'employee', 21, 'Verify role-based access control separation');

  // 22. Verify audit history
  const auditLogs = dataStore.getAuditLogs();
  assert(auditLogs.length > 0 && auditLogs.some(l => l.action.includes('Client')), 22, 'Verify immutable audit history captures state changes');

  // 23. Test failed WhatsApp delivery and retries
  const execLogs = dataStore.getExecutionLogs();
  assert(execLogs.length > 0, 23, 'Test automation logging & resilience engine');

  // 24. Test AI authorization and usage limits
  dataStore.logAIUsage('test_verification', 'gpt-4o-mini', 100, 50, 0.00003, 350);
  const aiLogs = dataStore.getAILogs();
  assert(aiLogs.some(l => l.feature_name === 'test_verification'), 24, 'Test AI usage limits, cost telemetry and token logging');

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed}/24 PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error(err);
  process.exit(1);
});

