"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Building2,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Send,
  X,
  Plus,
  ShieldCheck,
  Check,
  Smartphone,
  Layers,
  ArrowRight,
  Bell,
  RefreshCw,
  Zap
} from 'lucide-react';
import { initialDepartments } from '@/lib/dataStore';
import { Employee, Department } from '@/types';

export default function EmployeePortalPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Baileys live state
  const [baileysInfo, setBaileysInfo] = useState<{ status: string; phoneNumber?: string }>({
    status: 'connecting'
  });
  const [runningDailyReminders, setRunningDailyReminders] = useState(false);

  // Dedicated Reminder Modal State
  const [reminderModal, setReminderModal] = useState<{
    open: boolean;
    emp: Employee | null;
    text: string;
  }>({
    open: false,
    emp: null,
    text: ''
  });
  const [sendingReminder, setSendingReminder] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State (Designation removed in favor of Department connection)
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    department_id: 'dept-1',
    max_weekly_capacity_hours: 40,
    skills_text: ''
  });

  // Direct WhatsApp Message Modal State
  const [quickMsgModal, setQuickMsgModal] = useState<{ open: boolean; emp: Employee | null; text: string }>({
    open: false,
    emp: null,
    text: ''
  });
  const [sendingMsg, setSendingMsg] = useState(false);

  // Load employees and dynamic departments from API
  const loadData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/departments')
      ]);
      const [empData, deptData] = await Promise.all([
        empRes.json(),
        deptRes.json()
      ]);
      if (Array.isArray(empData)) setEmployees(empData);
      if (Array.isArray(deptData) && deptData.length > 0) {
        setDepartments(deptData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Baileys status
  const fetchBaileysStatus = async () => {
    try {
      const res = await fetch('/api/baileys');
      const data = await res.json();
      setBaileysInfo({
        status: data.status,
        phoneNumber: data.phoneNumber
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
    fetchBaileysStatus();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      full_name: '',
      phone_number: '+92',
      email: '',
      department_id: departments[0]?.id || 'dept-1',
      max_weekly_capacity_hours: 40,
      skills_text: 'Engineering, Operations'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      full_name: emp.full_name,
      phone_number: emp.phone_number,
      email: emp.email,
      department_id: emp.department_id,
      max_weekly_capacity_hours: emp.max_weekly_capacity_hours,
      skills_text: emp.skills?.map(s => s.skill_name).join(', ') || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone_number.trim()) {
      alert('Please fill in Full Name and WhatsApp Phone Number.');
      return;
    }

    const dept = departments.find(d => d.id === formData.department_id);
    const departmentRole = dept ? `${dept.name} Specialist` : 'Operations Specialist';

    const skills = formData.skills_text
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map((skill_name, idx) => ({
        id: `sk-${Date.now()}-${idx}`,
        employee_id: editingEmployee?.id || '',
        skill_name,
        proficiency_level: 'advanced' as const,
        years_experience: 3,
        is_primary: idx === 0
      }));

    try {
      if (editingEmployee) {
        // Update existing
        const res = await fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingEmployee.id,
            full_name: formData.full_name,
            position: departmentRole,
            phone_number: formData.phone_number,
            email: formData.email,
            department_id: formData.department_id,
            max_weekly_capacity_hours: Number(formData.max_weekly_capacity_hours),
            skills
          })
        });
        const updated = await res.json();
        setEmployees(prev => prev.map(emp => emp.id === updated.id ? updated : emp));
        showToast(`Updated profile for ${updated.full_name} (${dept?.name || 'Department'})`);
      } else {
        // Create new
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: formData.full_name,
            position: departmentRole,
            phone_number: formData.phone_number,
            email: formData.email,
            department_id: formData.department_id,
            max_weekly_capacity_hours: Number(formData.max_weekly_capacity_hours),
            skills
          })
        });
        const created = await res.json();
        setEmployees(prev => [...prev, created]);
        showToast(`Saved employee permanently: ${created.full_name} (Connected to ${dept?.name || 'Department'})`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving employee: ${err.message}`);
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete employee "${name}"?`)) return;

    try {
      await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      setEmployees(prev => prev.filter(e => e.id !== id));
      showToast(`Removed employee ${name}`);
    } catch (err: any) {
      alert(`Failed to delete employee: ${err.message}`);
    }
  };

  // Dispatch real WhatsApp message via Baileys
  const handleSendQuickWhatsApp = async () => {
    if (!quickMsgModal.emp || !quickMsgModal.text.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: quickMsgModal.emp.phone_number,
          message: quickMsgModal.text
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch WhatsApp message');
      }
      showToast(`WhatsApp sent to ${quickMsgModal.emp.full_name} (${data.jid || quickMsgModal.emp.phone_number})`);
      setQuickMsgModal({ open: false, emp: null, text: '' });
    } catch (err: any) {
      alert(`Failed to send WhatsApp message: ${err.message}`);
    } finally {
      setSendingMsg(false);
    }
  };

  // Open individual task reminder modal
  const handleOpenReminderModal = (emp: Employee) => {
    const greeting = `Good morning ${emp.full_name.split(' ')[0]}!\n\nThis is your operational reminder from RYZELS Operations.\n\nPlease check your active assignments for today and provide a progress update to Task Manager Talha Khan.\n\nThank you,\nRYZELS Operations`;
    setReminderModal({
      open: true,
      emp,
      text: greeting
    });
  };

  // Dispatch individual reminder via real WhatsApp Baileys
  const handleSendIndividualReminder = async () => {
    if (!reminderModal.emp || !reminderModal.text.trim()) return;
    setSendingReminder(true);
    try {
      const res = await fetch('/api/reminders/send-individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: reminderModal.emp.id,
          phoneNumber: reminderModal.emp.phone_number,
          customMessage: reminderModal.text
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to deliver reminder over WhatsApp');
      }
      showToast(`WhatsApp reminder sent to ${reminderModal.emp.full_name} (${data.jid || reminderModal.emp.phone_number})`);
      setReminderModal({ open: false, emp: null, text: '' });
    } catch (err: any) {
      alert(`WhatsApp Delivery Error: ${err.message}`);
    } finally {
      setSendingReminder(false);
    }
  };

  // Dispatch daily 9:00 AM reminders to all employees
  const handleRunDailyReminders = async () => {
    if (!confirm('Dispatch daily operational task summary to all registered employees via WhatsApp?')) return;
    setRunningDailyReminders(true);
    try {
      const res = await fetch('/api/reminders/run-daily', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch daily reminders');
      }
      showToast(`Daily WhatsApp reminders dispatched to ${data.dispatchedCount} team members!`);
    } catch (err: any) {
      alert(`Error dispatching daily reminders: ${err.message}`);
    } finally {
      setRunningDailyReminders(false);
    }
  };

  // Filtered list
  const filteredEmployees = employees.filter(emp => {
    const dept = departments.find(d => d.id === emp.department_id);
    const deptName = dept?.name || '';
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deptName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone_number.includes(searchQuery);
    const matchesDept = selectedDept === 'all' || emp.department_id === selectedDept;
    return matchesSearch && matchesDept;
  });

  const getDeptName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || 'General';
  };

  const teamStaff = employees.filter(e => e.role === 'employee');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">Company Employee Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{teamStaff.length} Team Members</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Register team members connected to your departments, link verified WhatsApp numbers, and automate daily 9:00 AM task reminders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <Link
            href="/departments"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center gap-2 transition-all shadow-md"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Department Portal</span>
          </Link>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WHATSAPP AUTOMATION & DAILY REMINDERS CONTROL PANEL                       */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">Daily WhatsApp Reminders Engine</span>
              {baileysInfo.status === 'connected' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>CONNECTED ({baileysInfo.phoneNumber || 'Baileys Multi-Device'})</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>NOT LINKED</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automated schedule: Daily at 9:00 AM PKT. Sends individual task summaries &amp; deadlines directly to each employee&apos;s phone.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunDailyReminders}
            disabled={runningDailyReminders}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{runningDailyReminders ? 'Dispatching to All...' : 'Run Daily 9:00 AM Reminders'}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, department, or WhatsApp number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedDept === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedDept === dept.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Cards Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Employees Registered</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? `No employees match "${searchQuery}". Clear your search or add a new team member.`
                : `You currently have no staff members registered. Click "+ Add New Employee" above to add your team members, connect them to your departments, and add their WhatsApp numbers.`}
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Employee</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployees.map((emp) => {
            const isManager = emp.role === 'task_manager';
            const initials = emp.full_name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const deptName = getDeptName(emp.department_id);

            return (
              <div
                key={emp.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                {/* Top Row: Avatar & Department Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md ${
                        isManager
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-500/20'
                          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/20'
                      }`}>
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                          <span>{emp.full_name}</span>
                          {isManager && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                              TASK MANAGER
                            </span>
                          )}
                        </h3>
                        {/* Connected Department Pill */}
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-bold">
                            <Building2 className="w-3 h-3 text-blue-400" />
                            <span>{deptName}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isManager && (
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Email & Capacity */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>Email:</span>
                      </span>
                      <span className="font-mono text-slate-300 text-[11px] truncate max-w-[170px]">{emp.email || 'None'}</span>
                    </div>
                  </div>

                  {/* WhatsApp Number Ribbon & Direct Actions */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">WhatsApp Number</span>
                        <span className="text-xs font-mono font-bold text-white">{emp.phone_number}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Reminder Button */}
                      <button
                        onClick={() => handleOpenReminderModal(emp)}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title="Send Instant Task Reminder via WhatsApp"
                      >
                        <Bell className="w-3 h-3 text-blue-400" />
                        <span>Reminder</span>
                      </button>

                      {/* Custom Message Button */}
                      <button
                        onClick={() => setQuickMsgModal({
                          open: true,
                          emp,
                          text: `Good morning ${emp.full_name.split(' ')[0]}! Please provide a status update on your active tasks.`
                        })}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title="Send custom message"
                      >
                        <Send className="w-3 h-3" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {emp.skills && emp.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {emp.skills.map(s => (
                        <span key={s.id} className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-medium text-slate-400 border border-slate-800">
                          {s.skill_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Workload Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1.5 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Weekly Capacity:</span>
                    </span>
                    <span className="font-bold text-white">{emp.current_workload_hours || 0}h / {emp.max_weekly_capacity_hours}h</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, ((emp.current_workload_hours || 0) / (emp.max_weekly_capacity_hours || 40)) * 100)}%` }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT EMPLOYEE MODAL (CONNECTED TO DEPARTMENT)                      */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingEmployee ? `Edit Employee: ${editingEmployee.full_name}` : 'Register New Employee'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Connect team member to an active department and link their verified WhatsApp number.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4 text-xs">
              
              {/* Full Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Full Name <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Muhammad Usman"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Connected Department */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold">
                    Connected Department <span className="text-rose-400">*</span>:
                  </label>
                  <Link
                    href="/departments"
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>+ Manage Departments</span>
                  </Link>
                </div>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Select which department this employee belongs to for task assignments &amp; workload routing.
                </p>
              </div>

              {/* WhatsApp Phone Number */}
              <div>
                <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                  <span>WhatsApp Phone Number <span className="text-emerald-400">*</span>:</span>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Used for task dispatch &amp; reminders
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="e.g. +923001234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Include international country code prefix (e.g. +92 for Pakistan, +1 for US/Canada).
                </p>
              </div>

              {/* Email Address & Weekly Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Email Address:</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. usman@ryzels.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Max Weekly Hours:</label>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={formData.max_weekly_capacity_hours}
                    onChange={(e) => setFormData({ ...formData, max_weekly_capacity_hours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Skills / Capabilities (comma-separated):</label>
                <input
                  type="text"
                  value={formData.skills_text}
                  onChange={(e) => setFormData({ ...formData, skills_text: e.target.value })}
                  placeholder="e.g. React, Next.js, WordPress, Speed Optimization"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-600/25 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEmployee ? 'Update Profile' : 'Save Employee Permanently'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEND INDIVIDUAL WHATSAPP REMINDER MODAL                                  */}
      {/* ========================================================================= */}
      {reminderModal.open && reminderModal.emp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  Send WhatsApp Reminder: {reminderModal.emp.full_name}
                </h3>
              </div>
              <button
                onClick={() => setReminderModal({ open: false, emp: null, text: '' })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Department:</span>
                <span className="text-white font-semibold">{getDeptName(reminderModal.emp.department_id)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">WhatsApp Destination:</span>
                <span className="text-emerald-400 font-mono font-bold">{reminderModal.emp.phone_number}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Reminder Message Preview:</span>
                <span className="text-[10px] text-blue-400">Transmitted directly to recipient phone</span>
              </label>
              <textarea
                rows={5}
                value={reminderModal.text}
                onChange={(e) => setReminderModal({ ...reminderModal, text: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-slate-500">
                Delivered via live Baileys WhatsApp connection.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReminderModal({ open: false, emp: null, text: '' })}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendIndividualReminder}
                  disabled={sendingReminder}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingReminder ? 'Transmitting...' : 'Send WhatsApp Reminder'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK WHATSAPP MESSAGE DISPATCH DIALOG                                    */}
      {/* ========================================================================= */}
      {quickMsgModal.open && quickMsgModal.emp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Send WhatsApp to {quickMsgModal.emp.full_name}
                </h3>
              </div>
              <button
                onClick={() => setQuickMsgModal({ open: false, emp: null, text: '' })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>Department: <span className="text-white font-semibold">{getDeptName(quickMsgModal.emp.department_id)}</span></p>
              <p>WhatsApp: <span className="text-emerald-400 font-mono font-bold">{quickMsgModal.emp.phone_number}</span></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Message Content:</label>
              <textarea
                rows={4}
                value={quickMsgModal.text}
                onChange={(e) => setQuickMsgModal({ ...quickMsgModal, text: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setQuickMsgModal({ open: false, emp: null, text: '' })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuickWhatsApp}
                disabled={sendingMsg}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingMsg ? 'Transmitting...' : 'Send WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
