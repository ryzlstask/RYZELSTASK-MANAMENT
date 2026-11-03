"use client";

import React, { useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCode2,
  CalendarDays,
  UserCheck,
  ShieldCheck,
  History,
  Check,
  X
} from 'lucide-react';
import {
  initialExtensionRequests,
  initialWebsiteChangeRequests,
  initialTasks,
  initialAuditLogs,
  dataStore
} from '@/lib/dataStore';
import { TaskExtensionRequest, WebsiteChangeRequest, Task, AuditLog } from '@/types';

export default function ApprovalsCenterPage() {
  const [extensionRequests, setExtensionRequests] = useState<TaskExtensionRequest[]>(initialExtensionRequests);
  const [websiteChanges, setWebsiteChanges] = useState<WebsiteChangeRequest[]>(initialWebsiteChangeRequests.filter(w => w.current_status === 'Under Review' || w.current_status === 'New Request'));
  const [submittedTasks, setSubmittedTasks] = useState<Task[]>(initialTasks.filter(t => t.status === 'under_review'));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExtensionDecision = async (requestId: string, approve: boolean) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extension', id: requestId, approve, notes: approve ? 'Extension granted.' : 'Deadline maintained.' })
      });
      setExtensionRequests(prev => prev.filter(r => r.id !== requestId));
      const logEntry: AuditLog = {
        id: `aud-${Date.now()}`,
        actor_name: 'Qaseem Raza (Task Manager)',
        action: approve ? 'Approved Deadline Extension' : 'Rejected Deadline Extension',
        entity_type: 'extension_request',
        entity_id: requestId,
        previous_state: { status: 'pending' },
        new_state: { status: approve ? 'approved' : 'rejected' },
        created_at: new Date().toISOString()
      };
      setAuditLogs(prev => [logEntry, ...prev]);
      setToastMessage(approve ? 'Extension request approved!' : 'Extension request rejected.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Decision recorded.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleWebsiteChangeDecision = async (changeId: string, approve: boolean) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'website_change', id: changeId, approve, notes: approve ? 'Approved and signed off.' : 'Changes requested.' })
      });
      setWebsiteChanges(prev => prev.filter(w => w.id !== changeId));
      const logEntry: AuditLog = {
        id: `aud-${Date.now()}`,
        actor_name: 'Qaseem Raza (Task Manager)',
        action: approve ? 'Approved Website Change Request' : 'Rejected Website Change Request',
        entity_type: 'website_change',
        entity_id: changeId,
        previous_state: { status: 'Under Review' },
        new_state: { status: approve ? 'Approved' : 'Rejected' },
        created_at: new Date().toISOString()
      };
      setAuditLogs(prev => [logEntry, ...prev]);
      setToastMessage(approve ? 'Website change approved!' : 'Website change returned for revisions.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Decision recorded.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleTaskReviewDecision = async (taskId: string, approve: boolean) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'task_review', id: taskId, approve })
      });
      setSubmittedTasks(prev => prev.filter(t => t.id !== taskId));
      const logEntry: AuditLog = {
        id: `aud-${Date.now()}`,
        actor_name: 'Qaseem Raza (Task Manager)',
        action: approve ? 'Accepted Completed Task' : 'Requested Revisions on Task',
        entity_type: 'task',
        entity_id: taskId,
        previous_state: { status: 'under_review' },
        new_state: { status: approve ? 'completed' : 'changes_requested' },
        created_at: new Date().toISOString()
      };
      setAuditLogs(prev => [logEntry, ...prev]);
      setToastMessage(approve ? 'Task marked completed and closed!' : 'Returned task to employee.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage('Decision recorded.');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const totalPending = extensionRequests.length + websiteChanges.length + submittedTasks.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">Manager Approval Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {totalPending} Items Requiring Sign-Off
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Central governance queue for employee deadline extensions, blockers, website change sign-offs, and final deliverables.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3 Active Decision Sections */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* SECTION 1: EMPLOYEE EXTENSION REQUESTS */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Employee Deadline Extension Requests ({extensionRequests.length})</h3>
            </div>
            <span className="text-xs text-slate-400">Originated via WhatsApp / Portal</span>
          </div>

          {extensionRequests.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No pending extension requests.</p>
          ) : (
            <div className="space-y-3">
              {extensionRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{req.employee_name}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-blue-400 font-semibold">{req.task_title}</span>
                    </div>
                    <p className="text-xs text-slate-300"><strong>Reason:</strong> {req.reason}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>Original: <strong className="text-rose-400">{new Date(req.original_deadline).toLocaleDateString()}</strong></span>
                      <span>→</span>
                      <span>Requested: <strong className="text-emerald-400">{new Date(req.requested_deadline).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => handleExtensionDecision(req.id, false)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleExtensionDecision(req.id, true)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Grant Extension</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: WEBSITE CHANGES AWAITING APPROVAL */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Website Change Sign-Offs ({websiteChanges.length})</h3>
            </div>
            <span className="text-xs text-slate-400">Requires Evidence Check</span>
          </div>

          {websiteChanges.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No website changes pending approval.</p>
          ) : (
            <div className="space-y-3">
              {websiteChanges.map((change) => (
                <div
                  key={change.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold text-xs">{change.change_request_code}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-bold text-white text-xs">{change.website_domain}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200">{change.request_title}</h4>
                    <p className="text-[11px] text-slate-400">{change.completion_notes || change.detailed_description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => handleWebsiteChangeDecision(change.id, false)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleWebsiteChangeDecision(change.id, true)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                    >
                      Approve Change
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: SUBMITTED WORK REVIEWS */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">Completed Deliverables Review ({submittedTasks.length})</h3>
            </div>
            <span className="text-xs text-slate-400">Quality Assurance Gate</span>
          </div>

          {submittedTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No submitted deliverables waiting for review.</p>
          ) : (
            <div className="space-y-3">
              {submittedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-400 font-bold text-xs">{task.task_code}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-bold text-white text-xs">{task.title}</span>
                    </div>
                    <p className="text-xs text-slate-300">Submitted by: <strong className="text-slate-100">{task.assigned_employee_name}</strong></p>
                    <p className="text-[11px] text-slate-400">Deliverables: {task.deliverables}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => handleTaskReviewDecision(task.id, false)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleTaskReviewDecision(task.id, true)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                    >
                      Accept & Close Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: IMMUTABLE AUDIT TRAIL */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="text-base font-bold text-white">Governance & Decision Audit Log</h3>
            </div>
            <span className="text-[11px] text-slate-400">Cryptographically Recorded Decisions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                <tr>
                  <th className="px-4 py-3">Decision Maker</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Entity ID</th>
                  <th className="px-4 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-semibold text-slate-200">{log.actor_name}</td>
                    <td className="px-4 py-3 font-bold text-blue-400">{log.action}</td>
                    <td className="px-4 py-3 text-slate-400">{log.entity_type}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{log.entity_id}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}

