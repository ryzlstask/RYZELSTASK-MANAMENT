"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Send,
  UploadCloud,
  Image as ImageIcon,
  X,
  Calendar,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  RefreshCw,
  Phone,
  Paperclip
} from 'lucide-react';
import { Task, TaskPriority, Employee, Department } from '@/types';

export default function TaskAssignmentPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<{ message: string; taskId?: string } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Form State: unified Task input (single big space)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [task, setTask] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [estimatedHours, setEstimatedHours] = useState(6);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load permanent employees, departments and recent tasks
  const loadData = async () => {
    try {
      const [empRes, deptRes, taskRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/departments'),
        fetch('/api/tasks')
      ]);

      const [empData, deptData, taskData] = await Promise.all([
        empRes.json(),
        deptRes.json(),
        taskRes.json()
      ]);

      if (Array.isArray(empData)) {
        setEmployees(empData);
        if (empData.length > 0 && !selectedEmployeeId) {
          setSelectedEmployeeId(empData[0].id);
          setSelectedDeptId(empData[0].department_id || '');
        }
      }

      if (Array.isArray(deptData)) {
        setDepartments(deptData);
      }

      if (Array.isArray(taskData)) {
        setRecentTasks(taskData.slice(0, 5));
      }
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      setErrorToast('Failed to load employee list. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selected employee changes, auto-select their department
  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp && emp.department_id) {
      setSelectedDeptId(emp.department_id);
    }
  };

  // Image Upload Handler (Convert to base64 for instant preview & WhatsApp delivery)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('File size exceeds 8MB. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImageUrl(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageUrl('');
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) {
      setErrorToast('Please enter the task.');
      return;
    }
    if (!selectedEmployeeId) {
      setErrorToast('Please select an employee.');
      return;
    }

    setSubmitting(true);
    setErrorToast(null);

    const emp = employees.find(e => e.id === selectedEmployeeId);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: task.trim(),
          employeeId: selectedEmployeeId,
          departmentId: selectedDeptId,
          priority,
          deadline,
          hours: estimatedHours,
          imageUrl: imageUrl || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      setRecentTasks(prev => [data, ...prev.slice(0, 4)]);
      setSuccessToast({
        message: data.whatsapp_dispatched
          ? `Task assigned & WhatsApp message dispatched to ${emp?.full_name} (${emp?.phone_number})!`
          : `Task saved to Operations Sheet with status ASSIGNED.`,
        taskId: data.id
      });

      // Clear Form
      setTask('');
      clearImage();
    } catch (err: any) {
      console.error('Task assignment error:', err);
      setErrorToast(err.message || 'Failed to assign task.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const selectedDepartment = departments.find(d => d.id === selectedDeptId);

  const empFirstName = selectedEmployee
    ? (selectedEmployee.full_name.split(' ')[0] || selectedEmployee.full_name)
    : 'Talha';

  const deadlineFormatted = new Date(deadline).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const priorityFormatted = priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/10">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Task Manager <span className="text-blue-500 font-normal text-sm md:text-base">• Assign Task</span>
              </h1>
              <p className="text-xs text-slate-400">
                Managed by <strong className="text-slate-200">Talha Khan</strong> • Dispatches instant WhatsApp task assignment & writes in Excel Sheet as <span className="text-blue-400 font-semibold">ASSIGNED</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/task-sheet"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all group"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
            <span>Open Operations Sheet (Excel Grid)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-sm flex items-start justify-between shadow-lg shadow-emerald-950/50 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold">{successToast.message}</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                Saved in Operations Sheet with status <strong>ASSIGNED</strong>. Live replies will update Employee Remarks automatically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/task-sheet"
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              View in Sheet
            </Link>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorToast && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p>{errorToast}</p>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Task Assignment Form */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Task Assignment</span>
                <span className="text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Instant WhatsApp Dispatch
                </span>
              </h2>
              <p className="text-xs text-slate-400">Fill in task parameters below</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Team</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Row 1: Employee and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Assign To Employee *</span>
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors font-medium"
                  required
                >
                  {employees.map((emp) => {
                    const dept = departments.find(d => d.id === emp.department_id);
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({dept?.name || 'General'}) • {emp.phone_number}
                      </option>
                    );
                  })}
                </select>
                {selectedEmployee && (
                  <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    WhatsApp Target: <strong>{selectedEmployee.phone_number}</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Department</span>
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors font-medium"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {selectedDepartment && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Connected Department: <strong className="text-slate-200">{selectedDepartment.name}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: ONE BIG SPACE INPUT NAMED "Task *" */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Task *</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Enter the task instructions / description</span>
              </label>
              <textarea
                rows={4}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter task (e.g. Image Editing, Design 3 Banner Creatives for Meta Ads Campaign, Configure domain DNS records...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
                required
              />
            </div>

            {/* Row 3: Due Date & Priority & Estimated Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Due Date (Last Date) *</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Estimated Hours</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  placeholder="e.g. 6"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Row 4: Place Image (Upload / URL) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Attach Image / Visual Reference (Optional)</span>
                </span>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove Image</span>
                  </button>
                )}
              </label>

              {!imagePreview ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* File Upload Box */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-950/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-900/50 group"
                  >
                    <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-blue-400 transition-colors mb-1.5" />
                    <p className="text-xs font-medium text-slate-200">Click to upload image file</p>
                    <p className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 8MB</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Or URL Input */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-center space-y-2">
                    <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                      <span>Or paste image URL:</span>
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/mockup.png"
                        value={imageUrl.startsWith('data:') ? '' : imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImagePreview(e.target.value || null);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Image will be sent directly to employee on WhatsApp</p>
                  </div>
                </div>
              ) : (
                /* Preview Container */
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2.5 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <img
                      src={imagePreview}
                      alt="Task Reference Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      Image attached successfully
                    </p>
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      Ready to be sent with WhatsApp message & saved in Excel sheet
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Click "Remove Image" above if you wish to change it.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/task-sheet"
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              >
                <span>Go to Operations Sheet</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all hover:shadow-blue-500/40"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching WhatsApp & Saving...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Assign Task & Send WhatsApp</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Sidebar: WhatsApp Exact Message Preview & Recent Tasks */}
        <div className="space-y-6">
          
          {/* WhatsApp Preview Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Message Preview</span>
            </h3>
            
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-sans text-xs text-slate-200 space-y-3 leading-relaxed">
              <p>Hello {empFirstName},</p>

              <p>A new task has been assigned to you:</p>

              <div className="space-y-1 pl-2 border-l-2 border-blue-500">
                <p><strong>Task:</strong> <span className="text-blue-300">{task || 'Image Editing'}</span></p>
                <p><strong>Priority:</strong> <span className="text-amber-300">{priorityFormatted}</span></p>
                <p><strong>Deadline:</strong> <span className="text-emerald-300">{deadlineFormatted}</span></p>
                {estimatedHours > 0 && (
                  <p><strong>Estimated Hours:</strong> <span className="text-purple-300">{estimatedHours}h</span></p>
                )}
              </div>

              {imagePreview && (
                <div className="text-purple-300 text-[11px] bg-purple-950/40 border border-purple-800/40 rounded-lg p-2 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>[Image Reference Attached]</span>
                </div>
              )}

              <p>Please have a look and complete it within the given deadline.</p>

              <p>Thank you for your cooperation! 😊</p>
            </div>

            <p className="text-[11px] text-slate-400">
              When dispatched, the task will be recorded in the Operations Sheet with status <strong className="text-blue-400">ASSIGNED</strong>.
            </p>
          </div>

          {/* Recent Tasks Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Recently Assigned</span>
              </h3>
              <Link href="/task-sheet" className="text-[11px] text-blue-400 hover:text-blue-300 font-medium">
                View All →
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No tasks assigned yet.</p>
              ) : (
                recentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {t.task_code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          t.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'in_progress'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : t.status === 'blocked'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {t.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white line-clamp-1">{t.title}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{t.assigned_employee_name || 'Unassigned'}</span>
                      <span>Due: {new Date(t.deadline).toLocaleDateString()}</span>
                    </div>

                    {t.employee_remarks && (
                      <div className="text-[10px] bg-slate-900 text-slate-300 p-1.5 rounded border border-slate-800 line-clamp-1">
                        💬 Remarks: {t.employee_remarks}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
