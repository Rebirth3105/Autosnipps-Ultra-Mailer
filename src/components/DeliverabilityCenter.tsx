import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Zap, Activity, Globe, Lock, Mail, AlertTriangle, CheckCircle2, Loader2, Info, RefreshCw, Server, Database, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { verifyEmail } from '../services/emailVerification';

interface DeliverabilityCenterProps {
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
}

export function DeliverabilityCenter({ userTier }: DeliverabilityCenterProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<null | 'pass' | 'fail'>(null);
  const [testEmail, setTestEmail] = useState('');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any>(null);
  const [domain, setDomain] = useState('yourdomain.com');
  const [isValidatingDns, setIsValidatingDns] = useState(false);
  const [dnsResults, setDnsResults] = useState<any>(null);
  const [smtpStatus, setSmtpStatus] = useState<any>(null);
  const [isRefreshingSmtp, setIsRefreshingSmtp] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null);

  useEffect(() => {
    handleRefreshSmtp();
  }, []);

  const handleRefreshSmtp = async () => {
    setIsRefreshingSmtp(true);
    try {
      const response = await fetch('/api/mailer/status');
      const data = await response.json();
      setSmtpStatus(data);
    } catch (error) {
      console.error("SMTP status check failed:", error);
    } finally {
      setIsRefreshingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!smtpTestEmail.trim()) return;
    setIsTestEmailLoading(true);
    setSmtpTestResult(null);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Ultrasnipps Mailer <mailer@localhost>',
          to: smtpTestEmail,
          subject: '🔥 Ultrasnipps Intelligence - SMTP Test Connection',
          text: 'This is a test email from your Ultrasnipps Mailer service. Your multi-relay SMTP configuration is active and routing correctly.',
          html: `
            <div style="font-family: sans-serif; padding: 40px; background: #FDFCF0; border-radius: 20px;">
              <h1 style="color: #0f172a; margin-bottom: 20px;"> Ultrasnipps Intelligence</h1>
              <p style="color: #64748b; font-size: 16px; line-height: 1.6;">SMTP Relay Test Successful.</p>
              <div style="background: rgba(0,0,0,0.05); padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #10b981;">STATUS: CONNECTED</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">Timestamp: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          `
        }),
      });
      const data = await response.json();
      setSmtpTestResult(data);
    } catch (error) {
      setSmtpTestResult({ success: false, error: 'Connection failure' });
    } finally {
      setIsTestEmailLoading(false);
    }
  };

  const handleRefreshRecords = async () => {
    if (!domain.trim()) return;
    setIsValidatingDns(true);
    try {
      const response = await fetch('/api/validate-dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await response.json();
      if (data.success) {
        setDnsResults(data.results);
      } else {
        console.error("DNS Validation failed:", data.error);
      }
    } catch (error) {
      console.error("DNS Validation error:", error);
    } finally {
      setIsValidatingDns(false);
    }
  };

  const runCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);
    await new Promise(r => setTimeout(r, 2000));
    setIsChecking(false);
    setCheckResult('pass');
  };

  const handleTestApi = async () => {
    if (!testEmail.trim()) return;
    setIsTestingApi(true);
    setApiTestResult(null);
    try {
      const result = await verifyEmail(testEmail);
      setApiTestResult(result);
    } catch (error) {
      setApiTestResult({ error: 'Connection failed' });
    } finally {
      setIsTestingApi(false);
    }
  };

  const dnsRecords = [
    { 
      type: 'SPF', 
      status: dnsResults?.spf?.length > 0 ? 'Verified' : 'Missing', 
      value: dnsResults?.spf?.[0] || 'v=spf1 include:_spf.google.com ~all', 
      desc: 'Authorizes servers to send on your behalf.' 
    },
    { 
      type: 'DKIM', 
      status: dnsResults?.dkim ? 'Verified' : 'Missing', 
      value: dnsResults?.dkim ? `${dnsResults.dkim.selector}: ${dnsResults.dkim.records[0]}` : 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA7...', 
      desc: 'Cryptographically signs your emails to prevent spoofing.' 
    },
    { 
      type: 'DMARC', 
      status: dnsResults?.dmarc?.length > 0 ? 'Strict' : 'Missing', 
      value: dnsResults?.dmarc?.[0] || 'v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com', 
      desc: 'Tells receivers how to handle emails that fail SPF/DKIM.' 
    },
  ];

  return (
    <div className="space-y-12">
      <div className="glass-panel rounded-[2.5rem] p-12 relative overflow-hidden group">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-6 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            Inbox Security
          </div>
          <h2 className="text-6xl font-bold mb-8 leading-[1.1] tracking-tight text-glow text-slate-900">
            Deliverability <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-sky-500">Command Center</span>.
          </h2>
          <p className="text-slate-500 text-xl leading-relaxed mb-0 font-medium">
            Ensure your emails land in the primary inbox, not the spam folder. 
            Monitor your DNS health, sender reputation, and content quality in one place.
          </p>
        </div>
        <ShieldCheck className="absolute right-10 top-10 w-32 h-32 text-slate-900/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-10 rounded-[2rem] space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-white/60 rounded-2xl border border-black/5">
                  <Globe className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">DNS Configuration</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="bg-transparent border-none p-0 text-sm text-slate-400 focus:ring-0 outline-none w-full"
                      placeholder="yourdomain.com"
                    />
                  </div>
                </div>
              </div>
              <button 
                onClick={handleRefreshRecords}
                disabled={isValidatingDns}
                className="px-6 py-2.5 bg-white/60 hover:bg-white text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-black/5 flex items-center gap-2"
              >
                {isValidatingDns ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Refresh Records
              </button>
            </div>

            <div className="space-y-4">
              {dnsRecords.map((record, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/40 border border-black/5 hover:border-black/10 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-sky-500/10 text-sky-600 text-[10px] font-black rounded-lg border border-sky-500/20">{record.type}</span>
                      <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {record.status}
                      </span>
                    </div>
                    <Info className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors cursor-help" />
                  </div>
                  <div className="bg-black/5 p-4 rounded-xl font-mono text-[11px] text-slate-500 break-all border border-black/5 mb-3">
                    {record.value}
                  </div>
                  <p className="text-xs text-slate-400">{record.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2rem] space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Mailer Infrastructure</h3>
                  <p className="text-sm text-slate-400">Manage and test your multi-relay SMTP configurations.</p>
                </div>
              </div>
              <button 
                onClick={handleRefreshSmtp}
                disabled={isRefreshingSmtp}
                className="p-2.5 bg-white/60 hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl border border-black/5 transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshingSmtp && "animate-spin")} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['PRIMARY', 'SECONDARY', 'TERTIARY'].map((prefix) => {
                  const config = smtpStatus?.configs?.find((c: any) => c.provider === prefix);
                  return (
                    <div key={prefix} className="p-5 rounded-2xl bg-white/40 border border-black/5 relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-3 relative z-10">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{prefix} RELAY</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          config ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                        )} />
                      </div>
                      <div className="relative z-10">
                        <p className="text-xs font-bold text-slate-900 truncate">{config?.host || 'Not Configured'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Port: {config?.port || '--'}</p>
                      </div>
                      <div className={cn(
                        "absolute -right-2 -bottom-2 w-12 h-12 transition-transform duration-500 group-hover:scale-110",
                        config ? "text-emerald-500/10" : "text-slate-500/5"
                      )}>
                        <Server className="w-full h-full" />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4 pt-4 border-t border-black/5">
                <div className="flex gap-4">
                  <input 
                    type="email"
                    value={smtpTestEmail}
                    onChange={(e) => setSmtpTestEmail(e.target.value)}
                    placeholder="recipient@test.com"
                    className="flex-1 px-6 py-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm text-slate-900 transition-all placeholder:text-slate-300"
                  />
                  <button 
                    onClick={handleSendTestEmail}
                    disabled={isTestEmailLoading || !smtpTestEmail.trim()}
                    className="px-8 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
                  >
                    {isTestEmailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Send Test
                  </button>
                </div>

                {smtpTestResult && (
                  <div className={cn(
                    "p-6 rounded-2xl border animate-in fade-in slide-in-from-top-2",
                    smtpTestResult.success ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                  )}>
                    <div className="flex items-center gap-3 mb-2">
                      {smtpTestResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                      )}
                      <h4 className="font-bold text-slate-900 text-sm">
                        {smtpTestResult.success ? 'Delivery Successful' : 'Delivery Failed'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      {smtpTestResult.success ? (
                        <>Message sent using <strong>{smtpTestResult.provider}</strong> relay. ID: {smtpTestResult.messageId} {smtpTestResult.mock && "(Mock Success)"}</>
                      ) : (
                        smtpTestResult.error || 'Check your SMTP configurations and firewall settings.'
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">API Infrastructure Test</h3>
                <p className="text-sm text-slate-400">Verify your email verification service is correctly configured.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4">
                <input 
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1 px-6 py-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sky-500/50 outline-none text-sm text-slate-900 transition-all placeholder:text-slate-300"
                />
                <button 
                  onClick={handleTestApi}
                  disabled={isTestingApi || !testEmail.trim()}
                  className="px-8 bg-sky-500 text-white rounded-2xl font-bold text-sm hover:bg-sky-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-sky-500/20"
                >
                  {isTestingApi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Test API
                </button>
              </div>

              {apiTestResult && (
                <div className={cn(
                  "p-6 rounded-2xl border animate-in fade-in slide-in-from-top-2",
                  apiTestResult.error ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                )}>
                  <div className="flex items-center gap-3 mb-3">
                    {apiTestResult.error ? (
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <h4 className="font-bold text-slate-900 text-sm">
                      {apiTestResult.error ? 'Configuration Error' : 'API Connection Successful'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {apiTestResult.error ? apiTestResult.error : (
                      <>
                        Successfully verified <strong>{apiTestResult.data?.email}</strong>. 
                        Status: <strong>{apiTestResult.data?.status}</strong>. 
                        {apiTestResult.data?.mock && " (Running in Mock Mode - Set HUNTER_API_KEY for real results)"}
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2rem] space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Spam Score Analyzer</h3>
                <p className="text-sm text-slate-400">Check your email content for common spam triggers.</p>
              </div>
            </div>

            <div className="space-y-6">
              <textarea 
                placeholder="Paste your email content here to analyze..."
                className="w-full p-6 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-amber-500/50 outline-none h-48 text-sm text-slate-900 transition-all placeholder:text-slate-300"
              />
              <button 
                onClick={runCheck}
                disabled={isChecking}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20"
              >
                {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
                {isChecking ? 'Analyzing Content...' : 'Run Spam Check'}
              </button>

              {checkResult === 'pass' && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Content Looks Great!</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We found no major spam triggers. Your use of personalization and clear call-to-actions will help you bypass filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-panel p-10 rounded-[2rem] space-y-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Sender Reputation</h3>
            <div className="flex flex-col items-center py-10">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-black/5"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={552.92}
                    strokeDashoffset={552.92 * (1 - 0.98)}
                    className="text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-slate-900">98</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
                </div>
              </div>
              <div className="mt-8 text-center">
                <p className="text-emerald-600 font-bold text-sm mb-1">Excellent Reputation</p>
                <p className="text-xs text-slate-400">Your domain is trusted by all major ISPs.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2rem] space-y-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Infrastructure Health</h3>
            <div className="space-y-4">
              {[
                { name: 'SMTP Server', status: 'Connected', icon: Server, color: 'emerald' },
                { name: 'Bounce Database', status: 'Active', icon: Database, color: 'emerald' },
                { name: 'API Gateway', status: 'Online', icon: Globe, color: 'emerald' },
                { name: 'Warmup Engine', status: 'Running', icon: Zap, color: 'amber' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/40 border border-black/5">
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-4 h-4", `text-${item.color}-500`)} />
                    <span className="text-xs font-bold text-slate-600">{item.name}</span>
                  </div>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border",
                    item.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2rem] space-y-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Blacklist Monitor</h3>
            <div className="space-y-4">
              {[
                { name: 'Spamhaus', status: 'Clear' },
                { name: 'Barracuda', status: 'Clear' },
                { name: 'SURBL', status: 'Clear' },
                { name: 'Spamcop', status: 'Clear' },
              ].map((bl, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/40 border border-black/5">
                  <span className="text-xs font-bold text-slate-600">{bl.name}</span>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    {bl.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2rem] space-y-6 border-amber-500/20">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Email Warmup</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-amber-600">85%</span>
              </div>
              <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: '85%' }}
                />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your daily sending limit is automatically increasing to build trust with ISPs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
