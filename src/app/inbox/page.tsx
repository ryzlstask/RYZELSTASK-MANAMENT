"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Bot,
  User,
  Shield,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Globe,
  Users,
  Calendar,
  Clock,
  Database,
  Search,
  MessageSquare,
  FileCheck,
  PhoneCall,
  Loader2,
  Power
} from 'lucide-react';
import {
  initialWhatsAppConversations,
  initialWhatsAppMessages,
  dataStore
} from '@/lib/dataStore';
import { WhatsAppConversation, WhatsAppMessage } from '@/types';
import { TASK_MANAGER_OFFICIAL_RULES } from '@/lib/portalContext';

export default function WhatsAppInboxPage() {
  const [activeTab, setActiveTab] = useState<'baileys' | 'openai' | 'messages'>('baileys');

  // Real Baileys Live State
  const [baileysStatus, setBaileysStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'qr_ready'>('connecting');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingMethod, setPairingMethod] = useState<'qr' | 'code'>('qr');
  const [phoneInput, setPhoneInput] = useState('');
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [baileysNotice, setBaileysNotice] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [isListenerEnabled, setIsListenerEnabled] = useState(true);
  const [togglingListener, setTogglingListener] = useState(false);

  // Portal Query State for Baileys Bot
  const [botQuery, setBotQuery] = useState('');
  const [botLoading, setBotLoading] = useState(false);
  const [botResponse, setBotResponse] = useState<string | null>(null);
  const [botEntities, setBotEntities] = useState<string[]>([]);

  // OpenAI API & Rules State
  const [apiKeyInput, setApiKeyInput] = useState('sk-proj-ryzels-ops-key-saved');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [aiConfigSaved, setAiConfigSaved] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Show all overdue tasks and tell me who is responsible');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Conversations State
  const [conversations, setConversations] = useState<WhatsAppConversation[]>(initialWhatsAppConversations);
  const [activeConvId, setActiveConvId] = useState<string>(initialWhatsAppConversations[0]?.id || '');
  const [messages, setMessages] = useState<WhatsAppMessage[]>(initialWhatsAppMessages);
  const [inputMessage, setInputMessage] = useState('');

  // Fetch real Baileys state & poll while waiting for user to scan QR
  const fetchBaileysStatus = async () => {
    try {
      const res = await fetch('/api/baileys');
      const data = await res.json();
      setBaileysStatus(data.status);
      if (data.qrCodeDataUrl) setQrCodeDataUrl(data.qrCodeDataUrl);
      if (data.phoneNumber) setConnectedPhone(data.phoneNumber);
      if (data.pairingCode) setPairingCode(data.pairingCode);
      if (typeof data.isListenerEnabled === 'boolean') {
        setIsListenerEnabled(data.isListenerEnabled);
      }
    } catch {
      // Network retry
    }
  };

  useEffect(() => {
    fetchBaileysStatus();

    // Poll every 3 seconds if connecting or waiting for QR scan
    const interval = setInterval(() => {
      fetchBaileysStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fetch OpenAI Config
  useEffect(() => {
    fetch('/api/openai')
      .then(r => r.json())
      .then(d => {
        if (d.maskedKey) setApiKeyInput(d.maskedKey);
        if (d.model) setSelectedModel(d.model);
      })
      .catch(() => {});
  }, []);

  // Force Request Fresh QR Code from WhatsApp Server
  const handleRefreshQr = async () => {
    setIsRefreshingQr(true);
    setQrCodeDataUrl(null);
    setBaileysStatus('connecting');
    try {
      const res = await fetch('/api/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_qr' })
      });
      const data = await res.json();
      if (data.qrCodeDataUrl) {
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setBaileysStatus('qr_ready');
      }
      setBaileysNotice('Fresh real-time WhatsApp QR code fetched from WhatsApp servers.');
      setTimeout(() => setBaileysNotice(null), 5000);
    } catch (err: any) {
      setBaileysNotice(`Failed to refresh QR: ${err.message}`);
    } finally {
      setIsRefreshingQr(false);
    }
  };

  // Disconnect WhatsApp Session
  const handleDisconnectBaileys = async () => {
    try {
      await fetch('/api/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
      });
      setBaileysStatus('disconnected');
      setConnectedPhone(null);
      setQrCodeDataUrl(null);
      setBaileysNotice('WhatsApp session disconnected. All session tokens cleared.');
      setTimeout(() => setBaileysNotice(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Request Official 8-Digit Pairing Code for Phone Number
  const handleRequestPairCode = async () => {
    if (!phoneInput.trim()) {
      alert('Please enter your phone number with country code (e.g. +923001234567)');
      return;
    }
    setCodeLoading(true);
    try {
      const res = await fetch('/api/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pair_code', phoneNumber: phoneInput })
      });
      const data = await res.json();
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
        setBaileysNotice(`Pairing Code Generated: ${data.pairingCode}. Check your phone to link.`);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCodeLoading(false);
    }
  };

  // Toggle WhatsApp Auto-Processing / Listener ON or OFF
  const handleToggleListener = async () => {
    setTogglingListener(true);
    try {
      const res = await fetch('/api/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_listener', enabled: !isListenerEnabled })
      });
      const data = await res.json();
      if (typeof data.isListenerEnabled === 'boolean') {
        setIsListenerEnabled(data.isListenerEnabled);
        setBaileysNotice(data.message || (data.isListenerEnabled ? 'WhatsApp Auto-Capture turned ON' : 'WhatsApp Auto-Capture turned OFF'));
        setTimeout(() => setBaileysNotice(null), 5000);
      }
    } catch (err: any) {
      alert(`Failed to toggle: ${err.message}`);
    } finally {
      setTogglingListener(false);
    }
  };

  // Test Bot Querying the Live Portal
  const handleRunBotQuery = async (queryText?: string) => {
    const q = queryText || botQuery;
    if (!q.trim()) return;
    setBotLoading(true);
    try {
      const res = await fetch('/api/baileys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query_portal', query: q, phoneNumber: connectedPhone })
      });
      const data = await res.json();
      setBotResponse(data.answer);
      setBotEntities(data.sourceEntities || []);
    } catch {
      setBotResponse("Unable to query portal context.");
    } finally {
      setBotLoading(false);
    }
  };

  // Save OpenAI Config
  const handleSaveOpenAi = async () => {
    try {
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', apiKey: apiKeyInput, model: selectedModel })
      });
      const data = await res.json();
      if (data.success) {
        setAiConfigSaved(true);
        setTimeout(() => setAiConfigSaved(false), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Test OpenAI with Task Manager Rules
  const handleTestRules = async () => {
    if (!testPrompt.trim()) return;
    setTestLoading(true);
    try {
      const res = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_rules', prompt: testPrompt })
      });
      const data = await res.json();
      setTestResponse(data.response);
    } catch {
      setTestResponse("Failed to execute rule evaluation.");
    } finally {
      setTestLoading(false);
    }
  };

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(TASK_MANAGER_OFFICIAL_RULES);
    setRulesCopied(true);
    setTimeout(() => setRulesCopied(false), 3000);
  };

  // Chat Helpers
  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeMessages = messages.filter(m => m.conversation_id === activeConvId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConvId) return;

    const textToSend = inputMessage;
    setInputMessage('');

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: activeConvId, message: textToSend })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBaileysNotice(`Notice: ${data.error || 'Failed to transmit message over WhatsApp'}`);
        return;
      }
      if (data.warning) {
        setBaileysNotice(data.warning);
      }
      setMessages(prev => [...prev, data.message]);
    } catch (err: any) {
      setBaileysNotice(`Network Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">WhatsApp Operations &amp; Baileys Gateway</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Task Manager: Talha Khan
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Link your mobile WhatsApp account via genuine Baileys Multi-Device QR code. The connected bot reads real-time site data and operates under Talha Khan&apos;s management rules.
          </p>
        </div>

        {/* Global Nav Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto max-w-full no-scrollbar">
          <button
            onClick={() => setActiveTab('baileys')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'baileys'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Baileys Live QR</span>
          </button>

          <button
            onClick={() => setActiveTab('openai')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'openai'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>OpenAI API &amp; Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'messages'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Chat Stream</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {baileysNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{baileysNotice}</span>
          </div>
          <button onClick={() => setBaileysNotice(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BAILEYS WHATSAPP REAL QR CODE & PORTAL SITE-READING ENGINE         */}
      {/* ========================================================================= */}
      {activeTab === 'baileys' && (
        <div className="space-y-6 animate-in fade-in">

          {/* Master Switch: WhatsApp Auto-Processing & Live Listener ON / OFF */}
          <div className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isListenerEnabled
              ? 'bg-slate-900/90 border-emerald-500/40 shadow-xl shadow-emerald-950/20'
              : 'bg-slate-900/90 border-amber-500/30 shadow-xl shadow-amber-950/20'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                isListenerEnabled
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-800 text-amber-400 border border-amber-500/30'
              }`}>
                <Power className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm md:text-base font-extrabold text-white">
                    WhatsApp System & Auto-Processing Engine
                  </h3>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wider ${
                    isListenerEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {isListenerEnabled ? 'SYSTEM ACTIVE (ON)' : 'SYSTEM PAUSED (OFF)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  {isListenerEnabled
                    ? 'Always ON by default: Captures employee replies (Completed, In Progress, Blocked) and updates remarks in the Operations Sheet silently.'
                    : 'System is completely turned OFF: All background capture is paused. No status or remarks will be modified.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleListener}
              disabled={togglingListener}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 ${
                isListenerEnabled
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-500/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
            >
              {togglingListener ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>{isListenerEnabled ? 'TURN OFF SYSTEM' : 'TURN ON SYSTEM'}</span>
            </button>
          </div>
          
          {/* Main Baileys Pairing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 5 Cols: Real QR Code Pairing Card */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center justify-between text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Status Header */}
              <div className="w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    baileysStatus === 'connected' ? 'bg-emerald-400 shadow-md shadow-emerald-400/50 animate-pulse' :
                    baileysStatus === 'connecting' ? 'bg-amber-400 animate-spin' :
                    'bg-slate-500'
                  }`} />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {baileysStatus === 'connected' ? 'Session Connected' :
                     baileysStatus === 'connecting' ? 'Fetching WhatsApp QR...' :
                     'Scan Code to Link'}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setPairingMethod('qr')}
                    className={`px-2.5 py-0.5 rounded font-semibold ${pairingMethod === 'qr' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    Live QR
                  </button>
                  <button
                    onClick={() => setPairingMethod('code')}
                    className={`px-2.5 py-0.5 rounded font-semibold ${pairingMethod === 'code' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                  >
                    Phone Code
                  </button>
                </div>
              </div>

              {/* Connection Status Card */}
              {baileysStatus === 'connected' ? (
                <div className="my-6 p-8 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/40 w-full flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-in zoom-in">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-white">Device Successfully Linked!</h3>
                  <p className="text-xs text-slate-300 font-mono mt-1 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    {connectedPhone || 'WhatsApp Multi-Device Active'}
                  </p>
                  <div className="mt-4 text-[11px] text-emerald-400 font-semibold space-y-1">
                    <p>✓ Supervised by Task Manager: <strong>Talha Khan</strong></p>
                    <p>✓ Real-Time Portal State Sync: <strong>100% Active</strong></p>
                    <p>✓ Incoming message AI auto-response: <strong>Ready</strong></p>
                  </div>
                </div>
              ) : pairingMethod === 'qr' ? (
                /* Real Scannable WhatsApp QR Code View */
                <div className="flex flex-col items-center my-3 w-full">
                  <div className="p-3 rounded-2xl bg-white shadow-2xl shadow-emerald-950/50 relative border-4 border-emerald-500">
                    {qrCodeDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeDataUrl}
                        alt="Authentic WhatsApp Pairing QR Code"
                        className="w-56 h-56 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-700 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                        <span className="text-xs font-bold">Connecting to WhatsApp Web...</span>
                        <span className="text-[10px] text-slate-500 text-center px-4">
                          Fetching real pairing token from WhatsApp official servers.
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3 font-medium">
                    Point your WhatsApp camera at this code to pair immediately.
                  </p>
                </div>
              ) : (
                /* WhatsApp 8-Digit Pairing Code View */
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 w-full my-4 flex flex-col items-center">
                  <span className="text-xs text-slate-400 mb-2">WhatsApp 8-Digit Pairing Code:</span>
                  {pairingCode ? (
                    <div className="text-3xl font-mono font-black text-emerald-400 tracking-widest bg-emerald-500/10 px-6 py-3 rounded-xl border border-emerald-500/20 mb-4 animate-in zoom-in">
                      {pairingCode}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic mb-4">
                      Enter your phone number below to receive an official pairing code.
                    </div>
                  )}

                  <input
                    type="text"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. +923001234567"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-center text-white mb-3 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleRequestPairCode}
                    disabled={codeLoading}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {codeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                    <span>{codeLoading ? 'Requesting Code...' : 'Get WhatsApp Pairing Code'}</span>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full mt-2 pt-3 border-t border-slate-800 flex items-center gap-2">
                {baileysStatus === 'connected' ? (
                  <button
                    onClick={handleDisconnectBaileys}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                  >
                    Disconnect WhatsApp Session
                  </button>
                ) : (
                  <button
                    onClick={handleRefreshQr}
                    disabled={isRefreshingQr}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQr ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingQr ? 'Requesting WhatsApp...' : 'Refresh QR Code'}</span>
                  </button>
                )}
              </div>

            </div>

            {/* Right 7 Cols: How to Connect & Live Site-Reading Capability */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* How to Connect Step-by-Step */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>How to Link Your WhatsApp Device (Real Connection)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="font-mono text-emerald-400 font-bold">1. Open WhatsApp</span>
                    <p className="text-slate-300 font-semibold mt-1">On Your Mobile Phone</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Launch WhatsApp on iOS or Android.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="font-mono text-emerald-400 font-bold">2. Linked Devices</span>
                    <p className="text-slate-300 font-semibold mt-1">Tap Settings / Menu</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Go to &quot;Linked Devices&quot; &gt; &quot;Link a Device&quot;.</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="font-mono text-emerald-400 font-bold">3. Scan QR Code</span>
                    <p className="text-slate-300 font-semibold mt-1">Scan Live Screen</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Point camera at the QR code on the left.</p>
                  </div>
                </div>
              </div>

              {/* What the Bot Reads in Real Time */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span>Real-Time Portal Data Accessible by WhatsApp Bot</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Supervised by Talha Khan
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                    <FileCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">Active Tasks</div>
                      <div className="text-[10px] text-slate-400">12 tasks, overdue alerts, deadlines</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                    <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">Client Websites</div>
                      <div className="text-[10px] text-slate-400">6 domains (abcgroup, abcelectronics, etc.)</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                    <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">Website Changes</div>
                      <div className="text-[10px] text-slate-400">4 pending, 10-stage governance trail</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                    <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">Team &amp; Workload</div>
                      <div className="text-[10px] text-slate-400">7 engineers, skill matrix &amp; 40h cap</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">Content Calendars</div>
                      <div className="text-[10px] text-slate-400">3 client brand feeds, 3-day lead time</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                    <Shield className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white">Approvals &amp; QA</div>
                      <div className="text-[10px] text-slate-400">Extensions, sign-offs &amp; audit logs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Bot Query Tester: "Read the Whole Site" */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>Test WhatsApp Bot: Read Portal Data</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Queries live database state</span>
                </div>

                <p className="text-[11px] text-slate-400 mb-3">
                  Click any prompt or type a question to test how the bot reads the whole portal:
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    "Show all overdue tasks across all websites",
                    "What are my active tasks and workload?",
                    "Check pending website changes for abcgroup.com",
                    "Show team workload capacity"
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => { setBotQuery(p); handleRunBotQuery(p); }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-slate-300 text-[11px] font-medium transition-all"
                    >
                      &quot;{p}&quot;
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={botQuery}
                    onChange={(e) => setBotQuery(e.target.value)}
                    placeholder="Ask the bot about tasks, websites, employees, or approvals..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRunBotQuery(); }}
                  />
                  <button
                    onClick={() => handleRunBotQuery()}
                    disabled={botLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{botLoading ? 'Querying...' : 'Ask Bot'}</span>
                  </button>
                </div>

                {/* Live Bot Response Output */}
                {botResponse && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold border-b border-slate-800/80 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5" />
                        <span>Baileys WhatsApp Bot Live Response:</span>
                      </span>
                      {botEntities.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-normal">Entities Read:</span>
                          {botEntities.map(ent => (
                            <span key={ent} className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                              {ent}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {botResponse}
                    </p>
                  </div>
                )}

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPENAI API CONFIGURATION & TASK MANAGER OPERATIONAL RULES          */}
      {/* ========================================================================= */}
      {activeTab === 'openai' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* OpenAI Configuration Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">OpenAI API Key &amp; Model Credentials</h2>
                  <p className="text-xs text-slate-400">
                    Supply your OpenAI API key so the Task Manager assistant can parse briefs, decompose complex tasks, and evaluate workload.
                  </p>
                </div>
              </div>

              {aiConfigSaved && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>OpenAI Credentials Saved &amp; Active</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5">
              {/* API Key Input */}
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  OpenAI Secret API Key:
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored securely on the server. Never exposed to unauthorized client browsers.
                </p>
              </div>

              {/* Model Selector */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Language Model:
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast &amp; Cost Effective - Recommended)</option>
                  <option value="gpt-4o">gpt-4o (High Intelligence Operations)</option>
                  <option value="o1-mini">o1-mini (Complex Reasoning)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleSaveOpenAi}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save &amp; Validate Credentials</span>
              </button>
            </div>
          </div>

          {/* Task Manager Official Rules Section */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Task Manager Talha Khan: Official Operational Rules</h3>
                  <p className="text-xs text-slate-400">
                    The strict operational guidelines the AI follows to understand the portal, protect employee workloads, and enforce QA.
                  </p>
                </div>
              </div>

              <button
                onClick={copyRulesToClipboard}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors self-start sm:self-center"
              >
                {rulesCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{rulesCopied ? 'Rules Copied!' : 'Copy Rules Prompt'}</span>
              </button>
            </div>

            {/* Structured Rules Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Database className="w-4 h-4" />
                  <span>Rule 1: Real-Time Portal State Ingestion</span>
                </div>
                <p className="text-slate-300">
                  The AI continuously reads tasks, deadlines, client profiles, multi-website registries, employee workloads, and manager approvals. Decisions are made from live database records, never hallucinations.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-400 font-bold">
                  <Users className="w-4 h-4" />
                  <span>Rule 2: Deterministic Workload Protection</span>
                </div>
                <p className="text-slate-300">
                  Employees have a strict 40h weekly limit. Skill matches score 40%, workload balance 30%, department 20%, availability 10%. Overloaded engineers (&gt;38h) are never automatically assigned.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <RefreshCw className="w-4 h-4" />
                  <span>Rule 3: 10-Stage Website Change Governance</span>
                </div>
                <p className="text-slate-300">
                  Website changes progress strictly: New Request &rarr; Approved &rarr; Assigned &rarr; In Progress &rarr; Under Review &rarr; Completed. Never auto-completed without before/after evidence check.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>Rule 4: Automated WhatsApp Reminders</span>
                </div>
                <p className="text-slate-300">
                  Personalized 9:00 AM daily briefings, 24h unaccepted task alerts, 48h manager escalations, and deadline warnings. If Human Takeover is engaged by Talha Khan, the AI stops automated replies immediately.
                </p>
              </div>

            </div>

            {/* Full Rulebook Raw View */}
            <details className="mt-3 group">
              <summary className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer select-none py-1">
                View Full Raw System Prompt &amp; Rules Text &darr;
              </summary>
              <pre className="mt-2 p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-64">
                {TASK_MANAGER_OFFICIAL_RULES}
              </pre>
            </details>
          </div>

          {/* Live Prompt & Rule Execution Tester */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Test AI Execution with Configured Rules &amp; Portal Data</span>
            </h3>

            <p className="text-xs text-slate-400">
              Run any prompt to verify how the Task Manager AI uses your credentials, official rules, and real portal data:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter prompt e.g., 'What are our overdue tasks and who should fix them?'"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => { if (e.key === 'Enter') handleTestRules(); }}
              />
              <button
                onClick={handleTestRules}
                disabled={testLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{testLoading ? 'Processing...' : 'Run Test'}</span>
              </button>
            </div>

            {testResponse && (
              <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/20 space-y-2 animate-in fade-in">
                <div className="text-[11px] text-blue-400 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>AI Operational Evaluation Output:</span>
                  <span className="text-slate-400 font-mono text-[10px]">Model: {selectedModel}</span>
                </div>
                <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {testResponse}
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE WHATSAPP CONVERSATIONS & HUMAN TAKEOVER                       */}
      {/* ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] lg:h-[640px] animate-in fade-in">
          
          {/* Left 4 Cols: Conversation Threads */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden max-h-72 lg:max-h-none">
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
              {conversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800/60 border-l-4 border-emerald-500' : 'hover:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-bold text-white text-xs">{conv.contact_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                      {conv.last_message_preview}
                    </p>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">{conv.phone_number}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        conv.is_human_takeover
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {conv.is_human_takeover ? 'HUMAN (TALHA)' : 'AI ACTIVE'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 8 Cols: Chat Stream */}
          {activeConv ? (
            <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden">
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{activeConv.contact_name}</h3>
                    <span className="text-xs text-slate-400 font-mono">({activeConv.phone_number})</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{activeConv.internal_notes || 'Operational Thread'}</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
                  <span className="text-xs font-semibold text-slate-300">Mode:</span>
                  <button
                    onClick={() => {
                      const next = !activeConv.is_human_takeover;
                      setConversations(prev => prev.map(c => c.id === activeConv.id ? { ...c, is_human_takeover: next } : c));
                      dataStore.toggleHumanTakeover(activeConv.id, next);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                      activeConv.is_human_takeover
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {activeConv.is_human_takeover ? 'Talha Human Mode Active' : 'AI Active (Take Over)'}
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
                {activeMessages.map((msg) => {
                  const isOut = msg.direction === 'outgoing';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOut ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md rounded-2xl p-3.5 text-xs shadow whitespace-pre-wrap ${
                          isOut
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80'
                        }`}
                      >
                        {msg.body}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isOut && (
                          <span>
                            {msg.sent_by_ai && <span className="text-cyan-400 font-semibold mr-1">[AI Bot]</span>}
                            {msg.delivery_status === 'read' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex gap-2">
                <input
                  type="text"
                  placeholder="Type WhatsApp message as Talha Khan..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-400">
              Select a conversation thread to view messages.
            </div>
          )}

        </div>
      )}

    </div>
  );
}
