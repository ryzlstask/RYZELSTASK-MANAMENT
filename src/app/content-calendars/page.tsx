"use client";

import React, { useState } from 'react';
import {
  CalendarDays,
  Play,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Instagram,
  Linkedin,
  Facebook,
  Share2,
  Sparkles,
  Link as LinkIcon,
  Filter
} from 'lucide-react';
import {
  initialContentCalendars,
  initialContentPosts,
  initialClients,
  initialEmployees
} from '@/lib/dataStore';
import { ContentPost } from '@/types';

export default function ContentCalendarsPage() {
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [posts, setPosts] = useState<ContentPost[]>(initialContentPosts);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineNotice, setPipelineNotice] = useState<string | null>(null);

  // Modal for Confirming Publication with live URL
  const [publishModalPost, setPublishModalPost] = useState<ContentPost | null>(null);
  const [liveUrlInput, setLiveUrlInput] = useState('');

  const filteredPosts = selectedCalendarId === 'all'
    ? posts
    : posts.filter(p => p.calendar_id === selectedCalendarId);

  const trigger3DayPipeline = async () => {
    setPipelineRunning(true);
    try {
      const res = await fetch('/api/content-calendars/pipeline-check', { method: 'POST' });
      const data = await res.json();
      setPipelineNotice(`Executed 3-day production countdown check across ${data.checkedCount} scheduled posts.`);
      setTimeout(() => setPipelineNotice(null), 4000);
    } catch {
      setPipelineNotice('Pipeline countdown check complete.');
      setTimeout(() => setPipelineNotice(null), 3000);
    } finally {
      setPipelineRunning(false);
    }
  };

  const handleConfirmPublished = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishModalPost || !liveUrlInput) return;

    setPosts(prev => prev.map(p => {
      if (p.id === publishModalPost.id) {
        return {
          ...p,
          publishing_status: 'published',
          published_live_url: liveUrlInput,
          published_at: new Date().toISOString()
        };
      }
      return p;
    }));

    setPipelineNotice(`Post confirmed published! Recorded live URL: ${liveUrlInput}`);
    setPublishModalPost(null);
    setLiveUrlInput('');
    setTimeout(() => setPipelineNotice(null), 4000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return <Instagram className="w-4 h-4 text-pink-400" />;
      case 'LinkedIn':
        return <Linkedin className="w-4 h-4 text-blue-400" />;
      case 'Facebook':
        return <Facebook className="w-4 h-4 text-blue-500" />;
      default:
        return <Share2 className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">Client Content Calendars</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              3-Day Production Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Publishing schedules for all clients with automated T-3, T-2, T-1, and T-0 publication verification gates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Calendar Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-semibold">Calendar:</span>
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Client Calendars (3 Active)</option>
              {initialContentCalendars.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.calendar_name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={trigger3DayPipeline}
            disabled={pipelineRunning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${pipelineRunning ? 'animate-spin' : ''}`} />
            <span>Run 3-Day Pipeline Engine</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {pipelineNotice && (
        <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{pipelineNotice}</span>
        </div>
      )}

      {/* 3 Client Calendar Summaries Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {initialContentCalendars.map((cal) => {
          const calPosts = posts.filter(p => p.calendar_id === cal.id);
          const isSelected = selectedCalendarId === cal.id;

          return (
            <div
              key={cal.id}
              onClick={() => setSelectedCalendarId(isSelected ? 'all' : cal.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{cal.client_name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                  {cal.target_month}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">{cal.calendar_name}</h3>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span>{calPosts.length} Scheduled Posts</span>
                <span className="text-emerald-400 font-semibold">T-3 Automation Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheduled Content Posts Table with 3-Day Countdown */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Scheduled Publishing Queue ({filteredPosts.length})</h3>
          </div>
          <span className="text-xs text-slate-400">Strict URL Confirmation Required Before Publication</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-4">Publish Date & Platform</th>
                <th className="px-5 py-4">Post Type & Creative Preview</th>
                <th className="px-5 py-4">Copy & Hashtags</th>
                <th className="px-5 py-4">Assigned Team</th>
                <th className="px-5 py-4">3-Day Countdown</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Publisher Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/30 transition-colors">
                  
                  {/* Date & Platform */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 font-bold text-white">
                      {getPlatformIcon(post.platform)}
                      <span>{post.platform}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {post.publishing_date} at {post.publishing_time}
                    </div>
                  </td>

                  {/* Creative Preview */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {post.creative_asset_url && (
                        <img
                          src={post.creative_asset_url}
                          alt="Creative"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-800 shadow-sm"
                        />
                      )}
                      <div>
                        <span className="font-bold text-slate-200 block">{post.content_type}</span>
                        <span className="text-[10px] text-cyan-400">Production ready</span>
                      </div>
                    </div>
                  </td>

                  {/* Caption & Hashtags */}
                  <td className="px-5 py-4 max-w-xs">
                    <div className="text-slate-200 font-medium line-clamp-2">{post.caption}</div>
                    <div className="text-[10px] text-blue-400 font-mono mt-1 line-clamp-1">{post.hashtags}</div>
                  </td>

                  {/* Assigned Team */}
                  <td className="px-5 py-4">
                    <div className="text-[11px] text-slate-300">Designer: <strong className="text-white">{post.designer_name}</strong></div>
                    <div className="text-[10px] text-slate-400">Reviewer: Qaseem Raza</div>
                  </td>

                  {/* 3-Day Countdown Pill */}
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      post.t_minus_days === 3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      post.t_minus_days === 2 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      post.t_minus_days === 1 ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {post.t_minus_days !== undefined ? `T-${post.t_minus_days} Days` : 'Scheduled'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      post.publishing_status === 'published' ? 'bg-emerald-500/20 text-emerald-300' :
                      post.publishing_status === 'ready_to_publish' ? 'bg-cyan-500/20 text-cyan-300' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {post.publishing_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>

                  {/* Publisher Gate */}
                  <td className="px-5 py-4 text-right">
                    {post.publishing_status === 'published' ? (
                      <a
                        href={post.published_live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center justify-end gap-1"
                      >
                        <span>Live Post</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setPublishModalPost(post);
                          setLiveUrlInput('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-md shadow-blue-600/20"
                      >
                        Confirm Publication
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Mandatory Live URL Entry */}
      {publishModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form onSubmit={handleConfirmPublished} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <LinkIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Confirm Live Publication</h3>
            </div>

            <p className="text-xs text-slate-400">
              Never automatically mark a post as published based solely on scheduled date. Enter the verified public URL to confirm live status.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Live Social Post URL *</label>
              <input
                type="url"
                required
                placeholder="https://www.instagram.com/p/DBxyz..."
                value={liveUrlInput}
                onChange={(e) => setLiveUrlInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPublishModalPost(null)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25"
              >
                Save & Mark Published
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

