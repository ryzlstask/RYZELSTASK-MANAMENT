"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Users2,
  RefreshCw,
  Search,
  CheckCircle2,
  Plus,
  Link as LinkIcon,
  Calendar,
  X,
  Volume2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { Task, Employee, Department, ClientWebsite, TaskStatus } from '@/types';

// Map status to 4 Kanban columns
type KanbanColumnId = 'backlog' | 'assigned' | 'in_progress' | 'completed';

const COLUMNS: { id: KanbanColumnId; title: string; headerColor: string; badgeBg: string }[] = [
  { id: 'backlog', title: 'Backlog', headerColor: 'text-slate-200', badgeBg: 'bg-slate-800 text-slate-300' },
  { id: 'assigned', title: 'Assigned', headerColor: 'text-blue-400', badgeBg: 'bg-blue-600 text-white' },
  { id: 'in_progress', title: 'In Progress', headerColor: 'text-amber-400', badgeBg: 'bg-amber-600 text-white' },
  { id: 'completed', title: 'Completed', headerColor: 'text-emerald-400', badgeBg: 'bg-emerald-600 text-white' }
];

function getColumnForStatus(status: TaskStatus): KanbanColumnId {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'in_progress':
    case 'under_review':
    case 'changes_requested':
      return 'in_progress';
    case 'assigned':
    case 'accepted':
    case 'blocked':
      return 'assigned';
    case 'pending_assignment':
    case 'proposed_ai':
    case 'cancelled':
    default:
      return 'backlog';
  }
}

function getStatusForColumn(col: KanbanColumnId): TaskStatus {
  switch (col) {
    case 'backlog':
      return 'pending_assignment';
    case 'assigned':
      return 'assigned';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
  }
}

function formatRelativeTime(dateString?: string, isCompleted?: boolean, completedAt?: string): string {
  if (!dateString && !completedAt) return '1h ago';
  const targetDate = isCompleted && completedAt ? new Date(completedAt) : new Date(dateString || Date.now());
  const now = new Date();
  const diffSec = Math.max(1, Math.floor((now.getTime() - targetDate.getTime()) / 1000));

  let timeStr = 'just now';
  if (diffSec >= 86400) {
    const days = Math.floor(diffSec / 86400);
    timeStr = `${days}d ago`;
  } else if (diffSec >= 3600) {
    const hours = Math.floor(diffSec / 3600);
    timeStr = `${hours}h ago`;
  } else if (diffSec >= 60) {
    const minutes = Math.floor(diffSec / 60);
    timeStr = `${minutes}m ago`;
  } else {
    timeStr = `${diffSec}s ago`;
  }

  return isCompleted ? `Completed ${timeStr}` : timeStr;
}

function getEmployeeInitials(name?: string): string {
  if (!name) return 'OP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDeadlineDate(dateStr?: string): string {
  if (!dateStr) return 'Nov 7';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Nov 7';
  }
}

export default function KanbanDashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [websites, setWebsites] = useState<ClientWebsite[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedWebsite, setSelectedWebsite] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(null);

  // Active hover/touch task for mobile & status controls
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // X Button confirmation modal
  const [taskToHide, setTaskToHide] = useState<Task | null>(null);
  const [isHiding, setIsHiding] = useState(false);

  // Audio playback
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  // Status update toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    try {
      const [taskRes, empRes, deptRes, webRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/employees'),
        fetch('/api/departments'),
        fetch('/api/websites')
      ]);

      const [taskData, empData, deptData, webData] = await Promise.all([
        taskRes.json(),
        empRes.json(),
        deptRes.json(),
        webRes.json()
      ]);

      if (Array.isArray(taskData)) setTasks(taskData);
      if (Array.isArray(empData)) setEmployees(empData);
      if (Array.isArray(deptData)) setDepartments(deptData);
      if (Array.isArray(webData)) setWebsites(webData);
    } catch (err) {
      console.error('Failed to load Kanban data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh periodically to reflect real-time Operations Sheet updates
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter tasks: exclude tasks where hidden_from_kanban === true
  const visibleTasks = useMemo(() => {
    return tasks.filter(t => !t.hidden_from_kanban);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return visibleTasks.filter(task => {
      if (selectedDept !== 'all' && task.department_id !== selectedDept) return false;
      if (selectedWebsite !== 'all') {
        const domain = (task.website_domain || task.project_name || '').toLowerCase();
        if (!domain.includes(selectedWebsite.toLowerCase())) return false;
      }
      if (selectedEmployee !== 'all' && task.assigned_employee_id !== selectedEmployee) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const domainMatch = task.website_domain?.toLowerCase().includes(query);
        const empMatch = task.assigned_employee_name?.toLowerCase().includes(query);
        const deptMatch = task.category?.toLowerCase().includes(query);
        if (!titleMatch && !domainMatch && !empMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [visibleTasks, selectedDept, selectedWebsite, selectedEmployee, searchQuery]);

  // Tasks grouped by column
  const columnTasks = useMemo(() => {
    const map: Record<KanbanColumnId, Task[]> = {
      backlog: [],
      assigned: [],
      in_progress: [],
      completed: []
    };
    filteredTasks.forEach(task => {
      const col = getColumnForStatus(task.status);
      map[col].push(task);
    });
    return map;
  }, [filteredTasks]);

  // Top summary metrics
  const assignedCount = columnTasks.assigned.length;
  const inProgressCount = columnTasks.in_progress.length;
  const pendingReviewCount = visibleTasks.filter(t => t.status === 'under_review' || t.status === 'proposed_ai').length || columnTasks.backlog.length;
  const completedCount = columnTasks.completed.length;

  // Handle Quick Status Change (Hover controls & Dropdown)
  const handleStatusChange = async (taskId: string, nextStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: nextStatus,
            updated_at: new Date().toISOString(),
            ...(nextStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
          };
        }
        return t;
      })
    );
    setActiveCardId(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: nextStatus
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update task status');
      }

      const updated = await res.json();
      showToast(`Status updated to ${nextStatus.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      console.error('Status change error:', err);
      showToast('Error syncing status. Reverting...');
      loadData();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, col: KanbanColumnId) => {
    e.preventDefault();
    if (dragOverColumn !== col) {
      setDragOverColumn(col);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, col: KanbanColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentCol = getColumnForStatus(task.status);
    if (currentCol === col) return;

    const nextStatus = getStatusForColumn(col);
    await handleStatusChange(taskId, nextStatus);
  };

  // Confirm X Button Hide
  const confirmHideTask = async () => {
    if (!taskToHide) return;
    setIsHiding(true);

    try {
      // Optimistically remove from Kanban view
      setTasks(prev =>
        prev.map(t => (t.id === taskToHide.id ? { ...t, hidden_from_kanban: true } : t))
      );

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskToHide.id,
          hidden_from_kanban: true
        })
      });

      if (!res.ok) {
        throw new Error('Failed to remove card from Kanban');
      }

      showToast('Card removed from Kanban. Preserved in Operations Sheet.');
    } catch (err: any) {
      console.error('Hide error:', err);
      showToast('Could not remove card.');
      loadData();
    } finally {
      setIsHiding(false);
      setTaskToHide(null);
    }
  };

  // Helper to resolve website domain
  const getTaskDomain = (task: Task): string => {
    if (task.website_domain && task.website_domain !== 'Operations') {
      return task.website_domain;
    }
    if (task.website_id) {
      const site = websites.find(w => w.id === task.website_id);
      if (site?.domain) return site.domain;
    }
    if (task.project_name && task.project_name !== 'Operations') {
      return task.project_name;
    }
    return 'Operations';
  };

  // Helper to resolve tag / department name
  const getTaskTag = (task: Task): string => {
    if (task.category && task.category !== 'Other') return task.category;
    if (task.department_id) {
      const dept = departments.find(d => d.id === task.department_id);
      if (dept) return dept.name;
    }
    return 'Operations';
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Audio Player Modal if Voice Note is Clicked */}
      {currentAudioUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCurrentAudioUrl(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Volume2 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Voice Note / Audio Preview</h3>
              </div>
              <button
                onClick={() => setCurrentAudioUrl(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <audio controls autoPlay src={currentAudioUrl} className="w-full" />
            <div className="text-right">
              <button
                onClick={() => setCurrentAudioUrl(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for X button */}
      {taskToHide && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => !isHiding && setTaskToHide(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Remove card from Kanban?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Removing <strong className="text-slate-200">"{taskToHide.title}"</strong> only hides it from the Kanban view. The task remains permanently stored in your database and Operations Sheet.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                disabled={isHiding}
                onClick={() => setTaskToHide(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isHiding}
                onClick={confirmHideTask}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {isHiding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                <span>Remove Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Subtitle */}
      <div className="text-xs text-slate-400">
        Track, manage and complete tasks across all websites and departments.
      </div>

      {/* Top 4 Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Assigned */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
            <Users2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Assigned</p>
            <p className="text-2xl font-black text-white leading-tight">{assignedCount}</p>
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">In Progress</p>
            <p className="text-2xl font-black text-white leading-tight">{inProgressCount}</p>
          </div>
        </div>

        {/* Card 3: Pending Review */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30 shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Pending Review</p>
            <p className="text-2xl font-black text-white leading-tight">{pendingReviewCount}</p>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Completed</p>
            <p className="text-2xl font-black text-white leading-tight">{completedCount}</p>
          </div>
        </div>

      </div>

      {/* Filter Bar & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800">
        
        {/* Left: Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:items-center gap-2.5 flex-1">
          
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Website Filter */}
          <select
            value={selectedWebsite}
            onChange={e => setSelectedWebsite(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Websites</option>
            {websites.map(w => (
              <option key={w.id} value={w.domain}>{w.website_name || w.domain}</option>
            ))}
            <option value="Ryzels.com">Ryzels.com</option>
            <option value="Operations">Operations</option>
          </select>

          {/* Employee Filter */}
          <select
            value={selectedEmployee}
            onChange={e => setSelectedEmployee(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks or websites..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

        </div>

        {/* Right: + Assign Task Button */}
        <Link
          href="/tasks"
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Task</span>
        </Link>

      </div>

      {/* Exactly Four Columns Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => {
          const tasksInCol = columnTasks[col.id] || [];
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.id)}
              className={`flex flex-col bg-slate-950/60 border rounded-2xl p-3 min-h-[480px] transition-all duration-200 ${
                isOver
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-950/10'
                  : 'border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              
              {/* Column Header Pill */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${col.badgeBg}`}
                >
                  <span>{col.title}</span>
                  <span className="opacity-90 font-black">{tasksInCol.length}</span>
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1">
                {tasksInCol.length === 0 ? (
                  <div className="h-32 rounded-xl border border-dashed border-slate-800/80 flex items-center justify-center text-slate-600 text-xs font-medium">
                    No tasks in {col.title}
                  </div>
                ) : (
                  tasksInCol.map(task => {
                    const domain = getTaskDomain(task);
                    const tag = getTaskTag(task);
                    const isCompleted = col.id === 'completed';
                    const relativeTime = formatRelativeTime(task.created_at, isCompleted, task.completed_at);
                    const initials = getEmployeeInitials(task.assigned_employee_name);
                    const isCardActive = activeCardId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable={true}
                        onDragStart={e => handleDragStart(e, task.id)}
                        onClick={() => setActiveCardId(prev => (prev === task.id ? null : task.id))}
                        className={`group relative bg-slate-900/90 border rounded-xl p-3.5 space-y-2.5 transition-all shadow-md cursor-grab active:cursor-grabbing ${
                          isCardActive
                            ? 'border-blue-500 ring-1 ring-blue-500/30'
                            : 'border-slate-800/90 hover:border-slate-700 hover:shadow-lg hover:shadow-black/40'
                        }`}
                      >
                        
                        {/* Top Row: Website / Domain + X Button */}
                        <div className="flex items-center justify-between gap-2 text-slate-400">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <LinkIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="text-xs font-semibold text-slate-300 truncate">
                              {domain}
                            </span>
                          </div>

                          {/* X Button at Top Right Corner */}
                          <div className="flex items-center gap-1 shrink-0">
                            {isCompleted && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                            <button
                              type="button"
                              title="Remove card from Kanban (preserves in DB)"
                              draggable={false}
                              onClick={e => {
                                e.stopPropagation();
                                setTaskToHide(task);
                              }}
                              className="w-5 h-5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Task Title */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 leading-snug line-clamp-2">
                            {task.title}
                          </h4>
                          {task.description && task.description !== task.title && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Middle Row: Tag + Voice Pill (if audio attached) + Real-time activity */}
                        <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Department / Category Pill */}
                            <span className="inline-block px-2 py-0.5 rounded-md bg-blue-950/70 border border-blue-800/50 text-blue-300 font-semibold text-[10px]">
                              {tag}
                            </span>

                            {/* Voice Note Pill */}
                            {task.audio_url && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setCurrentAudioUrl(task.audio_url || null);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 font-bold text-[10px] hover:bg-emerald-900/60 transition-colors"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Voice</span>
                              </button>
                            )}

                            {/* Blocked indicator */}
                            {task.status === 'blocked' && (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-red-950/70 border border-red-800/50 text-red-300 font-bold text-[10px]">
                                Blocked
                              </span>
                            )}
                          </div>

                          {/* Real-time / Last Activity Timestamp */}
                          <div className="flex items-center gap-1 text-slate-400 text-[10px] shrink-0">
                            <Clock className="w-2.5 h-2.5 opacity-70" />
                            <span>{relativeTime}</span>
                          </div>
                        </div>

                        {/* Bottom Row: Employee Avatar & Name + Deadline */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
                          {/* Employee */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-md bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-[10px] font-black shrink-0">
                              {initials}
                            </div>
                            <span className="text-[11px] font-medium text-slate-300 truncate">
                              {task.assigned_employee_name || 'Unassigned'}
                            </span>
                          </div>

                          {/* Deadline */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{formatDeadlineDate(task.deadline)}</span>
                          </div>
                        </div>

                        {/* Hover & Tap Quick Status Controls (Smooth Overlay) */}
                        <div
                          className={`pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 transition-all ${
                            isCardActive ? 'flex' : 'hidden group-hover:flex'
                          }`}
                        >
                          <span className="text-[10px] font-semibold text-slate-400">Move to:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleStatusChange(task.id, 'assigned');
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                task.status === 'assigned'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-blue-900/60 hover:text-blue-200'
                              }`}
                            >
                              Assigned
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleStatusChange(task.id, 'in_progress');
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                task.status === 'in_progress'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-amber-900/60 hover:text-amber-200'
                              }`}
                            >
                              In Progress
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleStatusChange(task.id, 'completed');
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                task.status === 'completed'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-emerald-900/60 hover:text-emerald-200'
                              }`}
                            >
                              Completed
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
