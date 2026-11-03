"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckSquare,
  TableProperties,
  Users2,
  Building2,
  MessageSquare,
  Sparkles,
  Activity,
  Layers
} from 'lucide-react';

const navigationItems = [
  { name: 'Assign Task', href: '/tasks', icon: CheckSquare, badge: 'Manager' },
  { name: 'Operations Sheet', href: '/task-sheet', icon: TableProperties, badge: 'Excel Grid' },
  { name: 'Employee Portal', href: '/employees', icon: Users2, badge: 'Team' },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'WhatsApp & AI Inbox', href: '/inbox', icon: MessageSquare, badge: 'Live' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-white text-lg">
          R
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-base tracking-wider">RYZELS</span>
            <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
              OPS AI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Enterprise Workspace</p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Operations Management
        </div>

        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span>{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-200">System Healthy</p>
              <p className="text-[10px] text-slate-400">PostgreSQL + WhatsApp</p>
            </div>
          </div>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
      </div>
    </aside>
  );
}

