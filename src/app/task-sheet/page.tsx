"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Phone,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Eye,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  Check,
  Power
} from 'lucide-react';
import { Task, Employee, Department, TaskStatus } from '@/types';

export default function OperationsSheetPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Reminders tracking
  const [remindingTaskId, setRemindingTaskId] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Modals state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activeMessageModal, setActiveMessageModal] = useState<Task | null>(null);
  const [editingRemarksTask, setEditingRemarksTask] = useState<Task | null>(null);
  const [remarksInput, setRemarksInput] = useState('');
  const [isWhatsAppActive, setIsWhatsAppActive] = useState(true);

  // Fetch all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [taskRes, empRes, deptRes, baileysRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/employees'),
        fetch('/api/departments'),
        fetch('/api/baileys').catch(() => null)
      ]);

      const [taskData, empData, deptData] = await Promise.all([
        taskRes.json(),
        empRes.json(),
        deptRes.json()
      ]);

      if (Array.isArray(taskData)) setTasks(taskData);
      if (Array.isArray(empData)) setEmployees(empData);
      if (Array.isArray(deptData)) setDepartments(deptData);

      if (baileysRes && baileysRes.ok) {
        const bData = await baileysRes.json();
        if (typeof bData.isListenerEnabled === 'boolean') {
          setIsWhatsAppActive(bData.isListenerEnabled);
        }
      }
    } catch (err) {
      console.error('Failed to load sheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWhatsApp = async () => {
    try {
      const res = await fetch('/api/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_listener', enabled: !isWhatsAppActive })
      });
      const data = await res.json();
      if (typeof data.isListenerEnabled === 'boolean') {
        setIsWhatsAppActive(data.isListenerEnabled);
        setReminderToast({
          message: data.message || (data.isListenerEnabled ? 'WhatsApp Auto-Capture turned ON' : 'WhatsApp Auto-Capture turned OFF')
        });
        setTimeout(() => setReminderToast(null), 4000);
      }
    } catch (err) {
      console.error('Failed to toggle WhatsApp:', err);
    }
  };

  useEffect(() => {
    loadData();
    // Fast auto-refresh every 2.5 seconds to pick up live WhatsApp replies and AI status updates
    const interval = setInterval(() => {
      fetch('/api/tasks')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setTasks(data);
        })
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Update Status Inline
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      loadData();
    }
  };

  // Save Remarks Inline
  const handleSaveRemarks = async () => {
    if (!editingRemarksTask) return;
    try {
      setTasks(prev => prev.map(t => t.id === editingRemarksTask.id ? { ...t, employee_remarks: remarksInput } : t));
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingRemarksTask.id, employee_remarks: remarksInput })
      });
      setEditingRemarksTask(null);
    } catch (err) {
      console.error('Failed to update remarks:', err);
    }
  };

  // Send WhatsApp Reminder
  const handleSendReminder = async (task: Task) => {
    setRemindingTaskId(task.id);
    setReminderToast(null);

    try {
      const res = await fetch('/api/tasks/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch reminder');
      }

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, last_reminder_sent_at: data.last_reminder_sent_at } : t));
      setReminderToast({
        message: data.warning || `WhatsApp reminder dispatched to ${task.assigned_employee_name || 'employee'}!`
      });
      setTimeout(() => setReminderToast(null), 4000);
    } catch (err: any) {
      setReminderToast({
        message: err.message || 'Failed to send WhatsApp reminder.',
        isError: true
      });
      setTimeout(() => setReminderToast(null), 5000);
    } finally {
      setRemindingTaskId(null);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Are you sure you want to delete task "${taskTitle}" from the Operations Sheet?`)) {
      return;
    }

    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task:', err);
      loadData();
    }
  };

  // Export to Excel / CSV
  const handleDownloadExcel = () => {
    if (tasks.length === 0) {
      alert('No tasks to export.');
      return;
    }

    // CSV Headers
    const headers = [
      '#',
      'Task Code',
      'Employee Name',
      'Employee Phone',
      'Department',
      'Task Title',
      'Message Body / Instructions',
      'Image Attached',
      'Added Date',
      'Due Date (Last Date)',
      'Current Status',
      'Employee Remarks (WhatsApp Reply)',
      'Last Reminder Sent'
    ];

    const rows = filteredTasks.map((t, idx) => {
      const emp = employees.find(e => e.id === t.assigned_employee_id);
      const dept = departments.find(d => d.id === t.department_id);
      const addedDate = t.created_at ? new Date(t.created_at).toLocaleString() : '';
      const dueDate = t.deadline ? new Date(t.deadline).toLocaleDateString() : '';
      const reminderSent = t.last_reminder_sent_at ? new Date(t.last_reminder_sent_at).toLocaleString() : 'Not sent yet';
      const hasImage = t.image_url ? (t.image_url.startsWith('http') ? t.image_url : 'Image Attached') : 'None';

      const escapeCSV = (val: string | undefined | null) => {
        if (!val) return '""';
        return `"${String(val).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
      };

      return [
        idx + 1,
        escapeCSV(t.task_code),
        escapeCSV(t.assigned_employee_name || emp?.full_name || 'Unassigned'),
        escapeCSV(emp?.phone_number || ''),
        escapeCSV(dept?.name || 'Operations'),
        escapeCSV(t.title),
        escapeCSV(t.description),
        escapeCSV(hasImage),
        escapeCSV(addedDate),
        escapeCSV(dueDate),
        escapeCSV(t.status.toUpperCase().replace('_', ' ')),
        escapeCSV(t.employee_remarks || ''),
        escapeCSV(reminderSent)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `operations_task_sheet_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    // Search query
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.assigned_employee_name && t.assigned_employee_name.toLowerCase().includes(q)) ||
      (t.task_code && t.task_code.toLowerCase().includes(q)) ||
      (t.employee_remarks && t.employee_remarks.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q));

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && t.status === 'completed') ||
      (statusFilter === 'in_progress' && t.status === 'in_progress') ||
      (statusFilter === 'blocked' && t.status === 'blocked') ||
      (statusFilter === 'assigned' && (t.status === 'assigned' || t.status === 'pending_assignment'));

    // Department filter
    const matchesDept =
      departmentFilter === 'all' || t.department_id === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.deadline) < new Date()).length;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/10">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Operations Sheet <span className="text-emerald-500 font-normal text-sm md:text-base">• Excel Task Grid</span>
              </h1>
              <p className="text-xs text-slate-400">
                Task Manager <strong className="text-slate-200">Talha Khan</strong> • Live WhatsApp updates, employee remarks & auto-capture
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all"
            title="Download full sheet as Excel CSV"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Sheet</span>
          </button>

          <Link
            href="/tasks"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Task</span>
          </Link>

          <button
            onClick={handleToggleWhatsApp}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all ${
              isWhatsAppActive
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50 shadow-sm shadow-emerald-950/50'
                : 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/50 shadow-sm shadow-amber-950/50'
            }`}
            title="Toggle WhatsApp Auto-Capture Engine ON or OFF"
          >
            <Power className="w-4 h-4" />
            <span>WhatsApp: {isWhatsAppActive ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Refresh Sheet"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Reminder Toast */}
      {reminderToast && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between shadow-lg animate-in fade-in duration-300 ${
            reminderToast.isError
              ? 'bg-rose-950/70 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {reminderToast.isError ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <p className="font-semibold">{reminderToast.message}</p>
          </div>
          <button onClick={() => setReminderToast(null)} className="p-1 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{totalTasks}</p>
          </div>
          <FileSpreadsheet className="w-5 h-5 text-slate-500" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">In Progress</p>
            <p className="text-xl font-extrabold text-amber-300 mt-0.5">{inProgressTasks}</p>
          </div>
          <Clock className="w-5 h-5 text-amber-400/80" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-extrabold text-emerald-300 mt-0.5">{completedTasks}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400/80" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Blocked / Issue</p>
            <p className="text-xl font-extrabold text-rose-300 mt-0.5">{blockedTasks}</p>
          </div>
          <AlertCircle className="w-5 h-5 text-rose-400/80" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-extrabold text-orange-300 mt-0.5">{overdueTasks}</p>
          </div>
          <AlertTriangle className="w-5 h-5 text-orange-400/80" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, employee, remarks, code..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked / Issue</option>
              <option value="assigned">Assigned / Pending</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 px-2">
            Showing <strong className="text-slate-200">{filteredTasks.length}</strong> of {tasks.length} tasks
          </div>
        </div>

      </div>

      {/* Excel Spreadsheet Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-[11px] text-emerald-400 font-medium">
          <span>👈 Swipe table horizontally to view all columns &amp; remarks 👉</span>
        </div>
        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            
            {/* Table Header (Excel Styled) */}
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="py-3.5 px-3 w-12 text-center border-r border-slate-800/60">#</th>
                <th className="py-3.5 px-3 w-28 border-r border-slate-800/60">Task ID</th>
                <th className="py-3.5 px-4 w-52 border-r border-slate-800/60">Employee & Dept</th>
                <th className="py-3.5 px-4 min-w-[240px] border-r border-slate-800/60">Task</th>
                <th className="py-3.5 px-3 w-24 text-center border-r border-slate-800/60">Image</th>
                <th className="py-3.5 px-3 w-28 border-r border-slate-800/60">Added Date</th>
                <th className="py-3.5 px-3 w-28 border-r border-slate-800/60">Due Date</th>
                <th className="py-3.5 px-3 min-w-[150px] border-r border-slate-800/60">Status</th>
                <th className="py-3.5 px-4 min-w-[240px] border-r border-slate-800/60 bg-emerald-950/20 text-emerald-300">
                  Employee Remarks (WhatsApp)
                </th>
                <th className="py-3.5 px-3 min-w-[210px] text-center border-r border-slate-800/60">Reminder & Quick Status</th>
                <th className="py-3.5 px-2 w-12 text-center">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No tasks found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
                        ? 'Try clearing your filters'
                        : 'Assign a new task to see it populated in this sheet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => {
                  const emp = employees.find(e => e.id === task.assigned_employee_id);
                  const dept = departments.find(d => d.id === task.department_id);
                  const isOverdue = task.status !== 'completed' && new Date(task.deadline) < new Date();
                  const addedDate = task.created_at
                    ? new Date(task.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : '-';
                  const dueDate = task.deadline
                    ? new Date(task.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : '-';

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* 1. Index */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px] border-r border-slate-800/60">
                        {idx + 1}
                      </td>

                      {/* 2. Task Code */}
                      <td className="py-3 px-3 border-r border-slate-800/60">
                        <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {task.task_code}
                        </span>
                      </td>

                      {/* 3. Employee & Department */}
                      <td className="py-3 px-4 border-r border-slate-800/60">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                            {task.assigned_employee_name || emp?.full_name || 'Unassigned'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                              {dept?.name || 'Operations'}
                            </span>
                            {emp?.phone_number && (
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {emp.phone_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Task */}
                      <td className="py-3 px-4 border-r border-slate-800/60">
                        <div className="space-y-1">
                          <p className="font-bold text-white text-xs line-clamp-2">{task.title}</p>
                          {task.description && task.description !== task.title && (
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <p className="line-clamp-1 flex-1 pr-2 text-slate-400">
                                {task.description}
                              </p>
                              <button
                                type="button"
                                onClick={() => setActiveMessageModal(task)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 underline shrink-0"
                              >
                                View
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Image Attached */}
                      <td className="py-3 px-3 text-center border-r border-slate-800/60">
                        {task.image_url ? (
                          <div
                            onClick={() => setLightboxImage(task.image_url || null)}
                            className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 hover:border-emerald-400 cursor-pointer mx-auto transition-all group-hover:scale-105 relative"
                            title="Click to view full image"
                          >
                            <img
                              src={task.image_url}
                              alt="Attached visual"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">None</span>
                        )}
                      </td>

                      {/* 6. Added Date */}
                      <td className="py-3 px-3 border-r border-slate-800/60 text-slate-300 font-mono text-[11px]">
                        {addedDate}
                      </td>

                      {/* 7. Due Date (Last Date) */}
                      <td className="py-3 px-3 border-r border-slate-800/60 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {dueDate}
                        </span>
                        {isOverdue && (
                          <span className="block text-[9px] text-rose-400 uppercase font-bold tracking-tight">
                            Overdue
                          </span>
                        )}
                      </td>

                      {/* 8. Status Dropdown */}
                      <td className="py-3 px-3 border-r border-slate-800/60 min-w-[150px]">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className={`w-full text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none transition-colors cursor-pointer tracking-wide ${
                            task.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-950/50'
                              : task.status === 'in_progress'
                              ? 'bg-amber-950 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/50'
                              : task.status === 'blocked'
                              ? 'bg-rose-950 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-950/50'
                              : 'bg-blue-950 text-blue-300 border-blue-500/50 shadow-sm shadow-blue-950/50'
                          }`}
                        >
                          <option value="assigned">ASSIGNED</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="completed">COMPLETED</option>
                          <option value="blocked">BLOCKED</option>
                        </select>
                      </td>

                      {/* 9. Employee Remarks (WhatsApp Live Captured - All Messages Preserved) */}
                      <td className="py-3 px-4 border-r border-slate-800/60 bg-emerald-950/10 min-w-[260px]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {task.employee_remarks ? (
                              (() => {
                                const remarksList = (task.employee_remarks_history && task.employee_remarks_history.length > 0)
                                  ? task.employee_remarks_history
                                  : task.employee_remarks.split('\n').filter(Boolean).map(msg => ({ message: msg, timestamp: task.updated_at }));
                                
                                return (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        {remarksList.length} Message{remarksList.length > 1 ? 's' : ''} Saved
                                      </span>
                                    </div>
                                    <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                                      {remarksList.map((entry, rIdx) => (
                                        <div
                                          key={rIdx}
                                          className="text-xs p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 space-y-0.5"
                                        >
                                          <p className="text-emerald-300 font-semibold leading-snug break-words">
                                            &ldquo;{entry.message}&rdquo;
                                          </p>
                                          {entry.timestamp && (
                                            <span className="block text-[9px] text-slate-400 font-mono">
                                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : task.last_reminder_sent_at ? (
                              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium animate-pulse">
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                <span>Waiting for employee reply...</span>
                              </div>
                            ) : (
                              <p className="text-slate-500 text-xs italic">
                                Waiting for employee reply...
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRemarksTask(task);
                              setRemarksInput(task.employee_remarks || '');
                            }}
                            className="text-slate-400 hover:text-emerald-400 p-1 shrink-0 mt-0.5"
                            title="Edit employee remarks"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 10. WhatsApp Reminder & Responsive Status Buttons */}
                      <td className="py-3 px-3 text-center border-r border-slate-800/60 min-w-[210px]">
                        <div className="space-y-1.5">
                          {/* Send Reminder Button */}
                          <button
                            type="button"
                            onClick={() => handleSendReminder(task)}
                            disabled={remindingTaskId === task.id}
                            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-semibold transition-all disabled:opacity-50"
                            title="Send WhatsApp reminder with COMPLETED, IN PROGRESS, BLOCKED options"
                          >
                            {remindingTaskId === task.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                            ) : (
                              <Send className="w-3 h-3 text-emerald-400" />
                            )}
                            <span>Send Reminder</span>
                          </button>

                          {/* Responsive Buttons: Completed, In Progress, Blocked */}
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(task.id, 'completed')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                task.status === 'completed'
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-emerald-400 hover:border-emerald-600/50'
                              }`}
                              title="Mark as Completed"
                            >
                              ✓ Done
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(task.id, 'in_progress')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                task.status === 'in_progress'
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-400 hover:border-amber-600/50'
                              }`}
                              title="Mark as In Progress"
                            >
                              ⏳ In Progress
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(task.id, 'blocked')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                task.status === 'blocked'
                                  ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/30'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-rose-400 hover:border-rose-600/50'
                              }`}
                              title="Mark as Blocked"
                            >
                              ⛔ Blocked
                            </button>
                          </div>

                          {task.last_reminder_sent_at && (
                            <span className="block text-[9px] text-slate-400">
                              Reminder sent {new Date(task.last_reminder_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 11. Delete Action */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <p>
            Auto-refresh active: incoming WhatsApp replies from employees automatically update rows and status in real time.
          </p>
          <p className="font-mono text-slate-400">
            {filteredTasks.length} rows loaded
          </p>
        </div>
      </div>

      {/* Lightbox Image Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-white flex items-center justify-center transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={lightboxImage}
              alt="Full Resolution Preview"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* View Full Message Body Modal */}
      {activeMessageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveMessageModal(null)}
        >
          <div
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {activeMessageModal.task_code}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {activeMessageModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveMessageModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">
                Full Instructions / WhatsApp Message Body:
              </label>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {activeMessageModal.description}
              </div>
            </div>

            {activeMessageModal.image_url && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Attached Visual:</label>
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-800">
                  <img
                    src={activeMessageModal.image_url}
                    alt="Attached"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxImage(activeMessageModal.image_url || null)}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveMessageModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Remarks Modal */}
      {editingRemarksTask && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingRemarksTask(null)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Edit Employee Remarks</h3>
                <p className="text-xs text-slate-400">{editingRemarksTask.title}</p>
              </div>
              <button onClick={() => setEditingRemarksTask(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Employee Answer / Remarks:
              </label>
              <textarea
                rows={3}
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                placeholder="Enter remarks or note what employee stated..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRemarksTask(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRemarks}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

