"use client";

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  MessageSquare,
  Sparkles,
  Globe,
  CheckSquare,
  FileText
} from 'lucide-react';
import { QuickActionModal } from './QuickActionModal';

export function Header() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'task' | 'website' | 'client' | 'change' | 'whatsapp' | 'report'>('task');

  const openQuickAction = (tab: 'task' | 'website' | 'client' | 'change' | 'whatsapp' | 'report') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 fixed top-0 left-64 right-0 z-30 px-6 flex items-center justify-between">
        
        {/* Global Search Bar */}
        <div className="flex items-center w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clients, websites, tasks, employees, change IDs..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Direct Quick Action Buttons */}
          <button
            onClick={() => openQuickAction('task')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>

          <button
            onClick={() => openQuickAction('change')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Website Change</span>
          </button>

          <button
            onClick={() => openQuickAction('whatsapp')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Send WhatsApp</span>
          </button>

          <button
            onClick={() => openQuickAction('report')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Daily Report</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-emerald-500/20">
              TK
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-tight">Talha Khan</p>
              <p className="text-[10px] text-emerald-400 font-medium">Head of Operations / Task Manager</p>
            </div>
          </div>

        </div>
      </header>

      {/* Quick Action Modal Component */}
      <QuickActionModal
        isOpen={modalOpen}
        defaultTab={modalTab}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

