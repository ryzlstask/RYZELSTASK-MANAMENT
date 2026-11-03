"use client";

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Building2,
  Users,
  CheckSquare,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Check,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Department, Employee, Task } from '@/types';

export default function DepartmentPortalPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  });

  const loadData = async () => {
    try {
      const [deptRes, empRes, taskRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/employees'),
        fetch('/api/tasks')
      ]);
      const [deptData, empData, taskData] = await Promise.all([
        deptRes.json(),
        empRes.json(),
        taskRes.json()
      ]);
      if (Array.isArray(deptData)) setDepartments(deptData);
      if (Array.isArray(empData)) setEmployees(empData);
      if (Array.isArray(taskData)) setTasks(taskData);
    } catch (err) {
      console.error('Failed to load department portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description,
      is_active: dept.is_active
    });
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a department name.');
      return;
    }

    try {
      if (editingDept) {
        // Update
        const res = await fetch('/api/departments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingDept.id,
            name: formData.name,
            code: formData.code,
            description: formData.description,
            is_active: formData.is_active
          })
        });
        const updated = await res.json();
        setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
        showToast(`Updated department: ${updated.name}`);
      } else {
        // Create new
        const res = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const created = await res.json();
        setDepartments(prev => [...prev, created]);
        showToast(`Created department: ${created.name} (${created.code})`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error saving department: ${err.message}`);
    }
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    const assignedEmps = employees.filter(e => e.department_id === id);
    if (assignedEmps.length > 0) {
      if (!confirm(`Warning: ${assignedEmps.length} employee(s) are currently assigned to ${name}. Are you sure you want to delete this department?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete department "${name}"?`)) return;
    }

    try {
      const res = await fetch(`/api/departments?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDepartments(prev => prev.filter(d => d.id !== id));
        showToast(`Removed department ${name}`);
      } else {
        alert(data.error || 'Failed to remove department');
      }
    } catch (err: any) {
      alert(`Failed to delete department: ${err.message}`);
    }
  };

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">Company Department Portal</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>{departments.length} Departments</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Organize company divisions, configure department routing, and connect employees for streamlined task execution.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-center">
          <Link
            href="/employees"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 flex items-center gap-2 transition-all"
          >
            <Users className="w-4 h-4 text-slate-400" />
            <span>Go to Employees</span>
          </Link>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Department</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-blue-500/40 text-blue-300 text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Departments</span>
            <span className="text-lg font-black text-white">{departments.length} Active Units</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Connected Staff</span>
            <span className="text-lg font-black text-white">{employees.length} Team Members</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Active Department Tasks</span>
            <span className="text-lg font-black text-white">{tasks.filter(t => t.status !== 'completed').length} Tasks</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search departments by name, code, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDepartments.map((dept) => {
          const deptEmployees = employees.filter(e => e.department_id === dept.id);
          const deptTasks = tasks.filter(t => t.department_id === dept.id && t.status !== 'completed');

          return (
            <div
              key={dept.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 p-5 flex flex-col justify-between transition-all group relative overflow-hidden"
            >
              <div>
                {/* Top Row: Name, Code & Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-500/20">
                      {dept.code}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {dept.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        ID: {dept.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(dept)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                      title="Edit Department"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {dept.description}
                </p>

                {/* Connected Employees Pill List */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>Connected Staff:</span>
                    </span>
                    <span className="font-bold text-white text-xs">{deptEmployees.length} Members</span>
                  </div>

                  {deptEmployees.length === 0 ? (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-500 text-center">
                      No employees assigned to this department yet.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {deptEmployees.map((emp) => (
                        <span
                          key={emp.id}
                          className="px-2 py-0.5 rounded-md bg-slate-950 text-[11px] font-medium text-slate-300 border border-slate-800 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{emp.full_name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Stat: Active Tasks */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Active Tasks:</span>
                </span>
                <span className="font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {deptTasks.length} active
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT DEPARTMENT MODAL                                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Define department name, short code, and operational description.
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
            <form onSubmit={handleSaveDepartment} className="p-6 space-y-4 text-xs">
              
              {/* Department Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Department Name <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mobile Engineering, Video Editing, Growth Marketing"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Department Short Code */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Short Code (2-5 letters):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. MOB, VID, MKTG"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Department Description:
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the scope of work handled by this department..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                  <span>{editingDept ? 'Update Department' : 'Save Department'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

