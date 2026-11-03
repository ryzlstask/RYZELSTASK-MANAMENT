"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Globe,
  Plus,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { initialClients, initialClientWebsites } from '@/lib/dataStore';
import { QuickActionModal } from '@/components/layout/QuickActionModal';

export default function ClientsPage() {
  const [clients, setClients] = useState(initialClients);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Client Portfolio</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage enterprise clients, associated digital estates, retainers, and primary stakeholders.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {clients.map((client) => {
          const clientWebsites = initialClientWebsites.filter(w => w.client_id === client.id);

          return (
            <div
              key={client.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{client.company_name}</h3>
                      <p className="text-xs text-slate-400">{client.industry}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                    {client.tier}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{client.notes}</p>

                {/* Primary Contact Info */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">{client.contact_person}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.contact_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.contact_phone}</span>
                  </div>
                </div>

                {/* Linked Websites Preview */}
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Managed Websites ({clientWebsites.length})
                  </p>
                  <div className="space-y-1.5">
                    {clientWebsites.map((web) => (
                      <div
                        key={web.id}
                        className="px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-semibold text-slate-200">{web.domain}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {web.platform}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>${client.monthly_retainer.toLocaleString()} / mo</span>
                </div>
                <Link
                  href={`/websites?client_id=${client.id}`}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 text-xs"
                >
                  Manage Websites <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <QuickActionModal
        isOpen={modalOpen}
        defaultTab="client"
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

