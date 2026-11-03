"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  MessageSquare,
  Globe,
  FileText,
  Menu,
  LogOut
} from 'lucide-react';
import { QuickActionModal } from './QuickActionModal';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'task' | 'website' | 'client' | 'change' | 'whatsapp' | 'report'>('task');

  const openQuickAction = (tab: 'task' | 'website' | 'client' | 'change' | 'whatsapp' | 'report') => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 fixed top-0 left-0 lg:left-64 right-0 z-30 px-3 sm:px-6 flex items-center justify-between">
        
        {/* Left Section: Mobile Menu Button + Search */}
        <div className="flex items-center gap-2 flex-1 max-w-sm sm:max-w-md">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 active:scale-95 transition-all"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-blue-400" />
          </button>

          {/* Global Search Bar */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Direct Quick Action Buttons */}
          <button
            onClick={() => openQuickAction('task')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Task</span>
          </button>

          <button
            onClick={() => openQuickAction('report')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Daily Report</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-0.5 sm:mx-1" />

          {/* User Profile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-emerald-500/20">
              TK
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-tight">Talha Khan</p>
              <p className="text-[10px] text-emerald-400 font-medium">Head of Operations</p>
            </div>
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-all"
            title="Log Out (admin)"
          >
            <LogOut className="w-4 h-4" />
          </button>

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
