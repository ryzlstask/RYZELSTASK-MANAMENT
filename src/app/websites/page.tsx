"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Plus,
  Building2,
  User,
  Shield,
  Layers,
  FileCode2,
  CheckSquare,
  ExternalLink,
  Filter,
  CheckCircle2,
  Server
} from 'lucide-react';
import {
  initialClients,
  initialClientWebsites,
  initialEmployees,
  initialWebsiteChangeRequests,
  initialTasks
} from '@/lib/dataStore';
import { QuickActionModal } from '@/components/layout/QuickActionModal';

export default function WebsitesWorkspacePage() {
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'task' | 'website' | 'change'>('website');

  // Dynamic filtering based on selected client
  const filteredWebsites = selectedClientId === 'all'
    ? initialClientWebsites
    : initialClientWebsites.filter(w => w.client_id === selectedClientId);

  const getEmployeeName = (empId?: string) => {
    return initialEmployees.find(e => e.id === empId)?.full_name || 'Unassigned';
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Client Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Client Websites Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated operational hub for every client domain, engineering ownership, platform stack, and change logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Client Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold">Filter Client:</span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Clients ({initialClientWebsites.length} Websites)</option>
              {initialClients.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { setModalTab('website'); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Website</span>
          </button>
        </div>
      </div>

      {/* Websites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWebsites.map((web) => {
          const client = initialClients.find(c => c.id === web.client_id);
          const changes = initialWebsiteChangeRequests.filter(c => c.website_id === web.id);
          const tasks = initialTasks.filter(t => t.website_id === web.id);

          return (
            <div
              key={web.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                
                {/* Title & Platform Tag */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-400">{client?.company_name}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{web.website_name}</h3>
                    <a
                      href={`https://${web.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
                    >
                      <span>{web.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    web.platform === 'WordPress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    web.platform === 'Shopify' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {web.platform}
                  </span>
                </div>

                {/* Team Responsibility Matrix */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Responsible Developer:</span>
                    <span className="font-semibold text-slate-200">{getEmployeeName(web.responsible_developer_id)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">SEO Lead:</span>
                    <span className="font-semibold text-slate-200">{getEmployeeName(web.seo_responsible_id)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">UI/UX Designer:</span>
                    <span className="font-semibold text-slate-200">{getEmployeeName(web.designer_id)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Website Manager:</span>
                    <span className="font-semibold text-blue-400">{getEmployeeName(web.website_manager_id)}</span>
                  </div>
                </div>

                {/* Operational Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Hosting Ref</span>
                    <span className="font-semibold text-slate-200 truncate block">{web.hosting_reference || 'Cloud Node 01'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/50">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Launch Date</span>
                    <span className="font-semibold text-slate-200">{web.launch_date || '2025-06-01'}</span>
                  </div>
                </div>

                {/* Live Task & Change Metrics */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>{changes.length} Change Requests</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{tasks.length} Active Tasks</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => { setModalTab('change'); setModalOpen(true); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Request Change
                </button>
                <Link
                  href={`/website-changes?website_id=${web.id}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold transition-colors"
                >
                  View Change Logs
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <QuickActionModal
        isOpen={modalOpen}
        defaultTab={modalTab}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

