import React, { useState } from 'react';
import { Settings, Shield, Zap, Activity, Mail, Lock, Server, Clock, AlertCircle, CheckCircle2, ChevronRight, Sliders, Calendar, Play, Pause, RotateCcw, Crown, Info, Bot, MessageSquare, Phone, Loader2, ShieldCheck, Send, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { generateWarmupSchedule, getStrategyDetails, WarmupConfig, WarmupDay } from '../services/warmupService';
import { logout, auth, regenerateToken } from '../services/firebase';

interface SettingsViewProps {
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
  onUpgradeClick: () => void;
  profile?: any;
}

export function SettingsView({ userTier, onUpgradeClick, profile }: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState('account');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentToken, setCurrentToken] = useState(profile?.token || 'SNIP-XXXX-XXXX');

  const handleRegenerate = async () => {
    if (userTier === 'page') return;
    setIsRegenerating(true);
    try {
      const newToken = await regenerateToken(auth.currentUser!.uid);
      setCurrentToken(newToken);
    } catch (err) {
      console.error("Failed to regenerate", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentToken || '');
  };
  const [smtpPort, setSmtpPort] = useState('587');
  const [maxEmailsPerHour, setMaxEmailsPerHour] = useState(500);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null);

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: "Autosnipps Test <noreply@autosnipps.com>",
          to: "test@example.com",
          subject: "SMTP Configuration Test",
          text: "This is a test email to verify your SMTP configuration and fallback logic."
        }),
      });
      const data = await response.json();
      setSmtpTestResult(data);
    } catch (error) {
      setSmtpTestResult({ error: 'Connection failed' });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const SaveButton = () => (
    <div className="flex items-center gap-4 pt-6 border-t border-black/5">
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        Save Changes
      </button>
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-emerald-500 font-bold text-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          Settings saved successfully
        </motion.div>
      )}
    </div>
  );
  
  const isDukeOrHigher = userTier === 'duke' || userTier === 'monarch' || userTier === 'emperor';
  const isMonarchOrHigher = userTier === 'monarch' || userTier === 'emperor';
  const isEmperor = userTier === 'emperor';
  
  const [warmupConfig, setWarmupConfig] = useState<WarmupConfig>({
    startLimit: 50,
    dailyIncrement: 50,
    targetLimit: 10000,
    strategy: 'conservative'
  });
  
  const [schedule, setSchedule] = useState<WarmupDay[]>(generateWarmupSchedule(warmupConfig));
  const [isWarmupActive, setIsWarmupActive] = useState(false);

  const handleUpdateSchedule = (newConfig: Partial<WarmupConfig>) => {
    const updated = { ...warmupConfig, ...newConfig };
    setWarmupConfig(updated);
    setSchedule(generateWarmupSchedule(updated));
  };

  const sections = [
    { id: 'smtp', label: 'SMTP Infrastructure', icon: Server },
    { id: 'sms', label: 'SMS Integration', icon: MessageSquare },
    { id: 'throttling', label: 'Throttling & Limits', icon: Sliders },
    { id: 'bounce', label: 'Bounce Management', icon: AlertCircle },
    { id: 'warmup', label: 'Warmup Schedule', icon: Calendar },
    { id: 'security', label: 'Security & API', icon: Lock },
    { id: 'account', label: 'Account & Rank', icon: UserIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.reload(); // Refresh to clear state
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="space-y-12">
      <div className="glass-panel rounded-[2.5rem] p-12 relative overflow-hidden group">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 text-xs font-bold uppercase tracking-widest mb-6 border border-sky-500/20">
            <Settings className="w-3 h-3" />
            System Configuration
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-[1.1] tracking-tight text-glow text-slate-900">
            Technical <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-amber-500">Infrastructure</span>.
          </h2>
          <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-0 font-medium">
            Fine-tune your sending engine for maximum performance. 
            Configure SMTP ports, set intelligent throttling limits, and manage your sender reputation.
          </p>
        </div>
        <Settings className="absolute right-10 top-10 w-32 h-32 text-slate-900/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all group",
                activeSection === section.id
                  ? "bg-white text-slate-900 shadow-lg border border-black/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
              )}
            >
              <section.icon className={cn(
                "w-5 h-5 transition-colors",
                activeSection === section.id ? "text-sky-500" : "text-slate-400 group-hover:text-slate-500"
              )} />
              {section.label}
              <ChevronRight className={cn(
                "ml-auto w-4 h-4 transition-transform",
                activeSection === section.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
              )} />
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="glass-panel p-10 rounded-[2rem] min-h-[600px]">
            {activeSection === 'smtp' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">SMTP Configuration</h3>
                  <p className="text-sm text-slate-500">Configure your primary outgoing mail server settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">SMTP Port</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['25', '465', '587'].map((port) => (
                        <button
                          key={port}
                          onClick={() => setSmtpPort(port)}
                          className={cn(
                            "py-3 rounded-xl text-xs font-bold border transition-all",
                            smtpPort === port
                              ? "bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20"
                              : "bg-white/60 border-black/5 text-slate-400 hover:border-black/10"
                          )}
                        >
                          {port}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 italic">
                      {smtpPort === '587' && "Recommended: Secure STARTTLS port, rarely blocked."}
                      {smtpPort === '465' && "Secure SSL/TLS port for legacy clients."}
                      {smtpPort === '25' && "Warning: Often blocked by cloud providers to prevent spam."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Encryption Method</label>
                    <select className="w-full p-4 bg-white/60 border border-black/5 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-500/50">
                      <option>STARTTLS (Recommended)</option>
                      <option>SSL/TLS</option>
                      <option>None (Insecure)</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-start gap-4">
                  <Activity className="w-6 h-6 text-sky-500 shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Auto-Detection Active</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Our system is automatically testing connection latency across multiple ports. 
                      Current optimal path: **Port 587 via STARTTLS** (Latency: 42ms).
                    </p>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleTestSmtp}
                        disabled={isTestingSmtp}
                        className="px-4 py-2 bg-sky-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-sky-600 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isTestingSmtp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Send Test Email
                      </button>
                      {smtpTestResult && (
                        <span className={cn(
                          "text-[10px] font-bold",
                          smtpTestResult.success ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {smtpTestResult.success 
                            ? `Success via ${smtpTestResult.provider}${smtpTestResult.mock ? ' (Mock)' : ''}` 
                            : 'Test Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <SaveButton />
              </div>
            )}

            {activeSection === 'sms' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">SMS Integration</h3>
                    <p className="text-sm text-slate-400">Configure your Twilio gateway for royal text delivery.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 rounded-full border border-sky-500/20">
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest">Twilio Connected</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Account SID</label>
                      <input 
                        type="password" 
                        value="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                        readOnly
                        className="w-full p-4 bg-white/60 border border-black/5 rounded-xl text-sm text-slate-500 font-mono"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Auth Token</label>
                      <input 
                        type="password" 
                        value="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                        readOnly
                        className="w-full p-4 bg-white/60 border border-black/5 rounded-xl text-sm text-slate-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white/40 border border-black/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Sender Number</label>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Verified</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-black/5">
                        <Phone className="w-5 h-5 text-sky-500" />
                        <span className="text-lg font-bold text-slate-900">+1 (555) 000-1234</span>
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-sky-500/5 border border-sky-500/10 space-y-3">
                      <div className="flex items-center gap-2 text-sky-600">
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Usage Note</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        SMS delivery rates vary by region. Your current rank allows for <strong>{userTier === 'emperor' || userTier === 'monarch' ? 'Unlimited' : userTier === 'duke' ? '500' : userTier === 'knight' ? '50' : '0'}</strong> monthly credits.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-black/5">
                  <h4 className="text-xs font-bold text-slate-900 mb-6 uppercase tracking-widest">SMS Delivery Reports</h4>
                  <div className="glass-panel rounded-2xl overflow-hidden border border-black/5">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/40 border-b border-black/5">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Recipient</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Sent At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {[
                          { to: '+1234567890', status: 'Delivered', date: '2024-03-21 14:30' },
                          { to: '+0987654321', status: 'Sent', date: '2024-03-21 14:25' },
                        ].map((item, i) => (
                          <tr key={i} className="hover:bg-white/40 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">{item.to}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                                item.status === 'Delivered' ? "bg-emerald-500/10 text-emerald-600" : "bg-sky-500/10 text-sky-600"
                              )}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">{item.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'throttling' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Throttling & Limits</h3>
                  <p className="text-sm text-slate-400">Prevent ISP blocking by controlling your sending speed.</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Max Emails Per Hour</label>
                      <span className="text-2xl font-black text-sky-600">{maxEmailsPerHour}</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="5000" 
                      step="10"
                      value={maxEmailsPerHour}
                      onChange={(e) => setMaxEmailsPerHour(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>10/hr (Safe)</span>
                      <span>5000/hr (Aggressive)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-white/40 border border-black/5">
                      <h4 className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-widest">Domain Throttling</h4>
                      <div className="space-y-3">
                        {[
                          { domain: 'gmail.com', limit: '20/min' },
                          { domain: 'outlook.com', limit: '50/min' },
                          { domain: 'yahoo.com', limit: '15/min' },
                        ].map((d) => (
                          <div key={d.domain} className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">{d.domain}</span>
                            <span className="text-slate-900 font-bold">{d.limit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/40 border border-black/5">
                      <h4 className="text-xs font-bold text-slate-900 mb-4 uppercase tracking-widest">Retry Logic</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Max Retries</span>
                          <span className="text-slate-900 font-bold">3 Attempts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Backoff Multiplier</span>
                          <span className="text-slate-900 font-bold">2.0x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'bounce' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Bounce Management</h3>
                    <p className="text-sm text-slate-400">Protect your reputation by managing invalid emails.</p>
                  </div>
                  <button className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-rose-500/20">
                    Clear All Suppressed
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-panel p-8 rounded-[2rem] border-black/5 bg-white/40 space-y-6">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-rose-500" />
                      <h4 className="font-bold text-slate-900">Suppression Rules</h4>
                    </div>
                    <div className="space-y-4">
                      {[
                        { label: 'Auto-suppress Hard Bounces', desc: 'Immediately blacklist emails that return a permanent failure.', default: true },
                        { label: 'Auto-suppress Spam Complaints', desc: 'Immediately blacklist users who mark your email as spam.', default: true },
                        { label: 'Soft Bounce Threshold', desc: 'Suppress after 3 consecutive temporary failures.', default: false },
                      ].map((rule, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 border border-black/5 group cursor-pointer hover:border-black/10 transition-all">
                          <div className="pt-1">
                            <input type="checkbox" defaultChecked={rule.default} className="w-4 h-4 rounded border-black/20 text-rose-500 focus:ring-0 transition-all cursor-pointer" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 mb-1">{rule.label}</p>
                            <p className="text-[10px] text-slate-400 leading-tight">{rule.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cn(
                    "glass-panel p-8 rounded-[2rem] border-amber-500/20 bg-amber-500/5 space-y-6 relative overflow-hidden",
                    !isDukeOrHigher && "opacity-80"
                  )}>
                    {!isDukeOrHigher && (
                      <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center">
                        <Crown className="w-6 h-6 text-amber-500 mb-2" />
                        <h4 className="font-bold text-slate-900 text-xs mb-1">Duke Feature</h4>
                        <p className="text-xs text-slate-500 mb-3">Ultrasnipps Bounce Analysis requires Duke rank or higher.</p>
                        <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-amber-500/20">
                          Ascend Now
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-amber-500" />
                      <h4 className="font-bold text-slate-900">Ultrasnipps Bounce Analysis</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ultrasnipps will analyze bounce logs to distinguish between "temporary ISP blocks" and "actual invalid addresses", preventing unnecessary suppression.
                    </p>
                    <div className="p-4 rounded-xl bg-white/60 border border-black/5 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
                      <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Ready to Activate</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl overflow-hidden border border-black/5">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/40 border-b border-black/5">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Reason</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {[
                        { email: 'bad-email@example.com', reason: 'Hard Bounce', date: '2024-03-21' },
                        { email: 'complaint@spam.com', reason: 'Spam Complaint', date: '2024-03-20' },
                        { email: 'full-inbox@test.org', reason: 'Soft Bounce', date: '2024-03-19' },
                      ].map((item, i) => (
                        <tr key={i} className="hover:bg-white/40 transition-colors group">
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">{item.email}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-xs font-black uppercase tracking-widest",
                              item.reason === 'Spam Complaint' ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"
                            )}>
                              {item.reason}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">{item.date}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-slate-300 hover:text-slate-900 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === 'warmup' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 relative">
                {!isMonarchOrHigher && (
                  <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-12 text-center rounded-[2rem]">
                    <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-amber-500/40 mb-6">
                      <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4">Monarch Warmup Engine</h3>
                    <p className="text-slate-500 max-w-md mb-8">
                      Automated SMTP warmup is a Monarch-exclusive feature. Ascend to Monarch to automatically build your sender reputation and land in the primary inbox.
                    </p>
                    <button className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all">
                      Ascend to Monarch
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">IP Warmup Automation</h3>
                    <p className="text-sm text-slate-400">Intelligently scale your sending volume to maximize deliverability.</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsWarmupActive(!isWarmupActive)}
                      className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                        isWarmupActive 
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                          : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      )}
                    >
                      {isWarmupActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isWarmupActive ? 'Pause Warmup' : 'Start Warmup'}
                    </button>
                    <button 
                      onClick={() => setSchedule(generateWarmupSchedule(warmupConfig))}
                      className="p-2.5 bg-white/60 hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl border border-black/5 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warmup Strategy</label>
                    <div className="grid grid-cols-1 gap-2">
                      {(['conservative', 'balanced', 'aggressive'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleUpdateSchedule({ strategy: s })}
                          className={cn(
                            "p-4 rounded-xl text-left border transition-all group",
                            warmupConfig.strategy === s
                              ? "bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20"
                              : "bg-white/60 border-black/5 text-slate-600 hover:border-black/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold capitalize">{s}</span>
                            {warmupConfig.strategy === s && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <p className={cn(
                            "text-[10px] leading-tight",
                            warmupConfig.strategy === s ? "text-white/80" : "text-slate-400"
                          )}>
                            {getStrategyDetails(s).description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Limit</label>
                        <input 
                          type="number"
                          value={warmupConfig.startLimit}
                          onChange={(e) => handleUpdateSchedule({ startLimit: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 bg-white/60 border border-black/5 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-500/50"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Limit</label>
                        <input 
                          type="number"
                          value={warmupConfig.targetLimit}
                          onChange={(e) => handleUpdateSchedule({ targetLimit: parseInt(e.target.value) || 0 })}
                          className="w-full p-4 bg-white/60 border border-black/5 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-sky-500/50"
                        />
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        The <strong>{warmupConfig.strategy}</strong> strategy will take approximately <strong>{schedule.length} days</strong> to reach your target of {warmupConfig.targetLimit.toLocaleString()} emails/day.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Projected Schedule</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day 1 - {schedule.length}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                    {schedule.map((day, i) => (
                      <div key={i} className={cn(
                        "aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden group/day",
                        day.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20" :
                        day.status === 'current' ? "bg-sky-500 border-sky-400 shadow-xl shadow-sky-500/20 scale-105 z-10" :
                        "bg-white/40 border-black/5"
                      )}>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest",
                          day.status === 'current' ? "text-white/60" : "text-slate-400"
                        )}>Day {day.day}</span>
                        <span className={cn(
                          "text-lg font-black tracking-tight",
                          day.status === 'current' ? "text-white" : "text-slate-900"
                        )}>{day.limit >= 1000 ? `${(day.limit / 1000).toFixed(1)}k` : day.limit}</span>
                        
                        {day.status === 'current' && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div className="h-full bg-white animate-progress" style={{ width: '65%' }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Account & Rank</h3>
                    <p className="text-sm text-slate-400">Manage your subscription and command center access.</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 rounded-[2rem] bg-white/40 border border-black/5 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-sky-500 flex items-center justify-center font-black text-xl text-white shadow-xl shadow-amber-500/20 overflow-hidden">
                        {auth.currentUser?.photoURL ? (
                          <img src={auth.currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          auth.currentUser?.displayName?.substring(0, 2).toUpperCase() || 'AA'
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{auth.currentUser?.displayName || 'Elite Sniper'}</h4>
                        <p className="text-xs text-slate-500">{auth.currentUser?.email}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      <div className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-black/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Rank</span>
                        <div className="flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{userTier}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-slate-900 text-white space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <Zap className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-bold text-white tracking-tight mb-2">Usage Quota</h4>
                      <p className="text-xs text-white/60 mb-6">Your current tier allows for sophisticated extraction and analysis.</p>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Monthly Usage</span>
                          <span className="text-xl font-black text-white">42 / 50</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 w-[84%]" />
                        </div>
                        <p className="text-[10px] text-white/40 italic">Next reset: May 24, 2026</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-sky-500/5 border border-sky-500/10">
                   <h4 className="font-bold text-slate-900 mb-4 tracking-tight">Active Access Token</h4>
                   <p className="text-sm text-slate-500 mb-6">This token serves as your secure access key for external purchasing platforms. Users on subscription plans can rotate this token for enhanced security.</p>
                   <div className="flex gap-4">
                     <div className="flex-1 relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          readOnly
                          value={currentToken}
                          className="w-full p-4 pl-12 bg-white border border-black/5 rounded-xl text-sm font-mono text-slate-600 focus:outline-none"
                        />
                     </div>
                     <button 
                       onClick={handleCopyToken}
                       className="px-6 bg-white border border-black/10 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                     >
                       Copy
                     </button>
                     <button 
                       onClick={handleRegenerate}
                       disabled={userTier === 'page' || isRegenerating}
                       className="px-6 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                     >
                       {isRegenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                       Rotate Token
                     </button>
                   </div>
                   {userTier === 'page' && (
                     <p className="text-[10px] text-amber-600 font-bold mt-4 flex items-center gap-2">
                       <Crown className="w-3 h-3" />
                       Token rotation is reserved for Knight rank and above.
                     </p>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
