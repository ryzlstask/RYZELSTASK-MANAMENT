"use client";

import React, { useState } from 'react';
import {
  FileCode2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  X,
  ExternalLink,
  Filter,
  ShieldCheck,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { initialWebsiteChangeRequests, initialClientWebsites, initialClients } from '@/lib/dataStore';
import { WebsiteChangeRequest, ChangeRequestStatus } from '@/types';
import { QuickActionModal } from '@/components/layout/QuickActionModal';

export default function WebsiteChangesPage() {
  const [changes, setChanges] = useState<WebsiteChangeRequest[]>(initialWebsiteChangeRequests);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeChange, setActiveChange] = useState<WebsiteChangeRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const filteredChanges = selectedStatus === 'all'
    ? changes
    : changes.filter(c => c.current_status === selectedStatus);

  const handleStatusUpdate = async (id: string, newStatus: ChangeRequestStatus, notes?: string) => {
    try {
      const res = await fetch('/api/website-changes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, notes })
      });
      const updated = await res.json();
      setChanges(prev => prev.map(c => c.id === id ? { ...c, current_status: newStatus, completion_notes: notes } : c));
      setStatusMessage(`Change request ${updated.change_request_code} marked as ${newStatus}.`);
      setReviewModalOpen(false);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch {
      setChanges(prev => prev.map(c => c.id === id ? { ...c, current_status: newStatus } : c));
      setReviewModalOpen(false);
    }
  };

  const getStatusBadge = (status: ChangeRequestStatus) => {
    switch (status) {
      case 'New Request':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Awaiting Clarification':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Assigned':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'In Progress':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'Under Review':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse';
      case 'Changes Required':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Completed':
        return 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40';
      case 'Rejected':
        return 'bg-slate-800 text-slate-400 border border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">Website Change Request Engine</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              10-Stage Governance
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated change tracking for client domains. Enforces mandatory before/after evidence validation and manager approval.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Changes ({changes.length})</option>
              <option value="New Request" className="bg-slate-900">New Request</option>
              <option value="In Progress" className="bg-slate-900">In Progress</option>
              <option value="Under Review" className="bg-slate-900">Under Review</option>
              <option value="Completed" className="bg-slate-900">Completed</option>
            </select>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Change Request</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Change Requests Table & Verification View */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-4">Request Code</th>
                <th className="px-5 py-4">Target Website & Client</th>
                <th className="px-5 py-4">Title & Details</th>
                <th className="px-5 py-4">Requester</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Evidence</th>
                <th className="px-5 py-4 text-right">Manager Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredChanges.map((change) => (
                <tr key={change.id} className="hover:bg-slate-800/30 transition-colors">
                  
                  {/* Code & Priority */}
                  <td className="px-5 py-4 font-mono font-bold text-slate-200">
                    <span className="text-cyan-400">{change.change_request_code}</span>
                    <span className={`block text-[10px] uppercase font-semibold mt-0.5 ${
                      change.priority === 'urgent' ? 'text-rose-400' :
                      change.priority === 'high' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {change.priority} Priority
                    </span>
                  </td>

                  {/* Target Website & Client */}
                  <td className="px-5 py-4">
                    <div className="font-bold text-white">{change.website_domain}</div>
                    <div className="text-[11px] text-slate-400">{change.client_name}</div>
                  </td>

                  {/* Title & Details */}
                  <td className="px-5 py-4 max-w-xs">
                    <div className="font-semibold text-slate-100 line-clamp-1">{change.request_title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{change.detailed_description}</div>
                  </td>

                  {/* Requester & Date */}
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-200">{change.requester}</div>
                    <div className="text-[11px] text-slate-400">{new Date(change.created_at).toLocaleDateString()}</div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(change.current_status)}`}>
                      {change.current_status}
                    </span>
                  </td>

                  {/* Evidence & Screenshots */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {change.before_change_reference && (
                        <a
                          href={change.before_change_reference}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1"
                          title="View Before Reference"
                        >
                          <ImageIcon className="w-3 h-3 text-amber-400" />
                          <span>Before</span>
                        </a>
                      )}
                      {change.after_evidence_screenshot_url && (
                        <a
                          href={change.after_evidence_screenshot_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] flex items-center gap-1"
                          title="View Completed Evidence"
                        >
                          <ImageIcon className="w-3 h-3 text-emerald-400" />
                          <span>After</span>
                        </a>
                      )}
                      {!change.before_change_reference && !change.after_evidence_screenshot_url && (
                        <span className="text-[11px] text-slate-400">None attached</span>
                      )}
                    </div>
                  </td>

                  {/* Actions / Review Gate */}
                  <td className="px-5 py-4 text-right">
                    {change.current_status === 'Under Review' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveChange(change);
                            setReviewModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Review & Approve</span>
                        </button>
                      </div>
                    ) : change.current_status === 'New Request' ? (
                      <button
                        onClick={() => handleStatusUpdate(change.id, 'Approved')}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold text-xs transition-colors"
                      >
                        Approve Request
                      </button>
                    ) : change.current_status === 'Approved' ? (
                      <button
                        onClick={() => handleStatusUpdate(change.id, 'In Progress')}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 font-semibold text-xs transition-colors"
                      >
                        Start Work
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Logged & Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Manager Review Gate Modal */}
      {reviewModalOpen && activeChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Manager Review Gate: {activeChange.change_request_code}</h3>
              </div>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p><strong>Website:</strong> {activeChange.website_domain}</p>
              <p><strong>Request:</strong> {activeChange.request_title}</p>
              {activeChange.after_evidence_screenshot_url && (
                <div>
                  <p className="font-bold text-slate-300 mb-1">Submitted Evidence Screenshot:</p>
                  <img
                    src={activeChange.after_evidence_screenshot_url}
                    alt="Evidence"
                    className="w-full h-44 object-cover rounded-xl border border-slate-800"
                  />
                </div>
              )}
              {activeChange.completion_notes && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                  <p className="font-semibold text-blue-400 mb-1">Developer Notes:</p>
                  <p>{activeChange.completion_notes}</p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Reviewer Assessment & Audit Notes</label>
                <textarea
                  rows={2}
                  placeholder="Verified mobile responsiveness and visual banner accuracy on production..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => handleStatusUpdate(activeChange.id, 'Changes Required', reviewNotes)}
                className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20"
              >
                Request Changes
              </button>
              <button
                onClick={() => handleStatusUpdate(activeChange.id, 'Completed', reviewNotes || 'Approved and signed off by Task Manager.')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20"
              >
                Approve & Mark Completed
              </button>
            </div>

          </div>
        </div>
      )}

      <QuickActionModal
        isOpen={modalOpen}
        defaultTab="change"
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

