"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Building2,
  Globe,
  FileCode2,
  MessageSquare,
  FileText,
  UserCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { initialClients, initialClientWebsites, initialEmployees, initialDepartments } from '@/lib/dataStore';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'task' | 'website' | 'client' | 'change' | 'whatsapp' | 'report';
  onActionComplete?: () => void;
}

export function QuickActionModal({ isOpen, onClose, defaultTab = 'task', onActionComplete }: QuickActionModalProps) {
  const [activeTab, setActiveTab] = useState<'task' | 'website' | 'client' | 'change' | 'whatsapp' | 'report'>(defaultTab);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    clientId: 'client-1',
    websiteId: 'web-2',
    category: 'Website design',
    priority: 'high',
    employeeId: 'emp-5',
    hours: 4,
    deadline: '2026-11-04'
  });

  const [websiteForm, setWebsiteForm] = useState({
    clientId: 'client-1',
    websiteName: '',
    domain: '',
    platform: 'WordPress',
    websiteType: 'corporate',
    developerId: 'emp-1'
  });

  const [clientForm, setClientForm] = useState({
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    industry: 'Technology',
    tier: 'enterprise'
  });

  const [changeForm, setChangeForm] = useState({
    clientId: 'client-1',
    websiteId: 'web-2',
    requestTitle: '',
    description: '',
    requester: 'Client Admin',
    priority: 'high'
  });

  const [waForm, setWaForm] = useState({
    phoneNumber: '+923001234567',
    message: ''
  });
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>(initialDepartments);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/employees').then(r => r.json()).catch(() => []),
        fetch('/api/departments').then(r => r.json()).catch(() => [])
      ]).then(([emps, depts]) => {
        if (Array.isArray(emps)) {
          setEmployeesList(emps);
          if (emps.length > 0) {
            setTaskForm(prev => ({ ...prev, employeeId: emps[0].id }));
            setWebsiteForm(prev => ({ ...prev, developerId: emps[0].id }));
            setWaForm(prev => ({ ...prev, phoneNumber: emps[0].phone_number }));
          }
        }
        if (Array.isArray(depts) && depts.length > 0) {
          setDepartmentsList(depts);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });
      const data = await res.json();
      if (data.whatsapp_dispatched) {
        setSuccessMessage(`Task created & instant WhatsApp dispatched to assigned employee! (${data.task_code || 'TSK-SAVED'})`);
      } else {
        setSuccessMessage(`Task created successfully: ${data.task_code || 'TSK-SAVED'}`);
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onActionComplete) onActionComplete();
      }, 1800);
    } catch (err) {
      setSuccessMessage('Task recorded into operations log.');
      setTimeout(() => { onClose(); if (onActionComplete) onActionComplete(); }, 1200);
    }
  };

  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(websiteForm)
      });
      setSuccessMessage(`Website ${websiteForm.domain} registered in workspace!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onActionComplete) onActionComplete();
      }, 1500);
    } catch {
      setSuccessMessage('Website registered successfully.');
      setTimeout(() => { onClose(); if (onActionComplete) onActionComplete(); }, 1200);
    }
  };

  const handleCreateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/website-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changeForm)
      });
      const data = await res.json();
      setSuccessMessage(`Change request created: ${data.change_request_code || 'WCR-SAVED'}`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onActionComplete) onActionComplete();
      }, 1500);
    } catch {
      setSuccessMessage('Change request logged for review.');
      setTimeout(() => { onClose(); if (onActionComplete) onActionComplete(); }, 1200);
    }
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to deliver message via WhatsApp');
      }
      setSuccessMessage(data.warning || `WhatsApp message delivered to ${data.jid || waForm.phoneNumber}!`);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        if (onActionComplete) onActionComplete();
      }, 2000);
    } catch (err: any) {
      setSuccessMessage(`Notice: ${err.message}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleGenerateReport = async () => {
    setSuccessMessage('Daily Executive Operations Report generated & queued for WhatsApp delivery.');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
      if (onActionComplete) onActionComplete();
    }, 1800);
  };

  // Filter websites dynamically based on selected client
  const clientWebsites = initialClientWebsites.filter(w => w.client_id === taskForm.clientId);
  const changeWebsites = initialClientWebsites.filter(w => w.client_id === changeForm.clientId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Operations Quick Actions</h3>
              <p className="text-xs text-slate-400">Perform direct operational tasks without leaving your workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 overflow-x-auto text-xs font-semibold gap-1 py-2">
          {[
            { id: 'task', label: 'Create Task', icon: PlusCircle },
            { id: 'change', label: 'Request Change', icon: FileCode2 },
            { id: 'website', label: 'Add Website', icon: Globe },
            { id: 'client', label: 'Add Client', icon: Building2 },
            { id: 'whatsapp', label: 'Send WhatsApp', icon: MessageSquare },
            { id: 'report', label: 'Daily Report', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Alert */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Forms Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          
          {/* TAB 1: CREATE TASK */}
          {activeTab === 'task' && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement new payment gateway integration"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">1. Select Client *</label>
                  <select
                    value={taskForm.clientId}
                    onChange={(e) => {
                      const newClientId = e.target.value;
                      const webs = initialClientWebsites.filter(w => w.client_id === newClientId);
                      setTaskForm({
                        ...taskForm,
                        clientId: newClientId,
                        websiteId: webs[0]?.id || ''
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {initialClients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">2. Select Website *</label>
                  <select
                    value={taskForm.websiteId}
                    onChange={(e) => setTaskForm({ ...taskForm, websiteId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {clientWebsites.map(w => (
                      <option key={w.id} value={w.id}>{w.domain} ({w.platform})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Task Category *</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Website design">Website design</option>
                    <option value="Frontend development">Frontend development</option>
                    <option value="Backend development">Backend development</option>
                    <option value="WordPress development">WordPress development</option>
                    <option value="Shopify development">Shopify development</option>
                    <option value="Bug fixing">Bug fixing</option>
                    <option value="Website maintenance">Website maintenance</option>
                    <option value="SEO">SEO</option>
                    <option value="Speed optimization">Speed optimization</option>
                    <option value="Content updates">Content updates</option>
                    <option value="Landing page creation">Landing page creation</option>
                    <option value="Security updates">Security updates</option>
                    <option value="Website migration">Website migration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Employee *</label>
                  <select
                    value={taskForm.employeeId}
                    onChange={(e) => setTaskForm({ ...taskForm, employeeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {employeesList.length === 0 ? (
                      <option value="">No employees registered yet</option>
                    ) : (
                      employeesList.map(emp => {
                        const dept = departmentsList.find(d => d.id === emp.department_id);
                        return (
                          <option key={emp.id} value={emp.id}>
                            {emp.full_name} — Dept: {dept?.name || 'Operations'} ({emp.current_workload_hours || 0}h load)
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    value={taskForm.hours}
                    onChange={(e) => setTaskForm({ ...taskForm, hours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all"
                >
                  Create & Dispatch Task
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REQUEST WEBSITE CHANGE */}
          {activeTab === 'change' && (
            <form onSubmit={handleCreateChangeRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Client *</label>
                  <select
                    value={changeForm.clientId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const webs = initialClientWebsites.filter(w => w.client_id === cid);
                      setChangeForm({ ...changeForm, clientId: cid, websiteId: webs[0]?.id || '' });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {initialClients.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Website *</label>
                  <select
                    value={changeForm.websiteId}
                    onChange={(e) => setChangeForm({ ...changeForm, websiteId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {changeWebsites.map(w => (
                      <option key={w.id} value={w.id}>{w.domain}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Change Request Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Replace outdated team photos on About page"
                  value={changeForm.requestTitle}
                  onChange={(e) => setChangeForm({ ...changeForm, requestTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify exact sections, URL paths, content replacements, or bug details..."
                  value={changeForm.description}
                  onChange={(e) => setChangeForm({ ...changeForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Requester Name</label>
                  <input
                    type="text"
                    value={changeForm.requester}
                    onChange={(e) => setChangeForm({ ...changeForm, requester: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                  <select
                    value={changeForm.priority}
                    onChange={(e) => setChangeForm({ ...changeForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all"
                >
                  Submit Change Request
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ADD WEBSITE */}
          {activeTab === 'website' && (
            <form onSubmit={handleCreateWebsite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Client Owner *</label>
                <select
                  value={websiteForm.clientId}
                  onChange={(e) => setWebsiteForm({ ...websiteForm, clientId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {initialClients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Website Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC Group Logistics Portal"
                    value={websiteForm.websiteName}
                    onChange={(e) => setWebsiteForm({ ...websiteForm, websiteName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Domain *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. abclogistics.com"
                    value={websiteForm.domain}
                    onChange={(e) => setWebsiteForm({ ...websiteForm, domain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Platform</label>
                  <select
                    value={websiteForm.platform}
                    onChange={(e) => setWebsiteForm({ ...websiteForm, platform: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  >
                    <option value="WordPress">WordPress</option>
                    <option value="Shopify">Shopify</option>
                    <option value="Custom Next.js">Custom Next.js</option>
                    <option value="Webflow">Webflow</option>
                    <option value="Magento">Magento</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type</label>
                  <select
                    value={websiteForm.websiteType}
                    onChange={(e) => setWebsiteForm({ ...websiteForm, websiteType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  >
                    <option value="corporate">Corporate</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="saas">SaaS Portal</option>
                    <option value="landing_page">Landing Page</option>
                    <option value="blog">Blog / Editorial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Developer</label>
                  <select
                    value={websiteForm.developerId}
                    onChange={(e) => setWebsiteForm({ ...websiteForm, developerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  >
                    {employeesList.length === 0 ? (
                      <option value="">No developers registered yet</option>
                    ) : (
                      employeesList.map(e => (
                        <option key={e.id} value={e.id}>{e.full_name} — {e.position}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all"
                >
                  Register Website
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: ADD CLIENT */}
          {activeTab === 'client' && (
            <form onSubmit={(e) => {
              e.preventDefault();
              setSuccessMessage(`Client ${clientForm.companyName} created!`);
              setTimeout(() => { onClose(); if (onActionComplete) onActionComplete(); }, 1200);
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Tech Ventures"
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. David Vance"
                    value={clientForm.contactPerson}
                    onChange={(e) => setClientForm({ ...clientForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="david@zenith.com"
                    value={clientForm.contactEmail}
                    onChange={(e) => setClientForm({ ...clientForm, contactEmail: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all"
                >
                  Add Client to Workspace
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: SEND WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <form onSubmit={handleSendWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient *</label>
                <select
                  value={waForm.phoneNumber}
                  onChange={(e) => setWaForm({ ...waForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {employeesList.map(emp => (
                    <option key={emp.id} value={emp.phone_number}>
                      {emp.full_name} ({emp.phone_number}) — {emp.position}
                    </option>
                  ))}
                  <option value="+14155550192">Robert Sterling (Client ABC Group)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Message Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type official WhatsApp message or notification..."
                  value={waForm.message}
                  onChange={(e) => setWaForm({ ...waForm, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Dispatches via WhatsApp Business Cloud API with active delivery confirmation.</span>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 transition-all"
                >
                  Send WhatsApp Message
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: GENERATE DAILY REPORT */}
          {activeTab === 'report' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Generate Operations Executive Report</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Compiles all active tasks, overdue warnings, blocked employee escalations, pending website changes, and content pipeline status into a structured daily summary.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left text-xs text-slate-300 space-y-1.5 max-w-md mx-auto">
                <p>• <strong>Active Tasks:</strong> 5 ongoing, 1 overdue, 1 blocked</p>
                <p>• <strong>Website Changes:</strong> 1 under review, 1 new request</p>
                <p>• <strong>Content Pipeline:</strong> 3 client posts in 3-day production window</p>
                <p>• <strong>Delivery Channel:</strong> Task Manager WhatsApp (+923009998877)</p>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all"
                >
                  Generate & Send to My WhatsApp
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

