import React, { useState, useMemo } from 'react';
import { SortingUnit } from './SortingUnit';
import { FileUploadUnit } from './FileUploadUnit';
import { ProviderDirectory } from './ProviderDirectory';
import { Search, Loader2, Link as LinkIcon, FileText, Copy, CheckCircle2, AlertTriangle, ShieldAlert, Users, Plus, ShieldCheck, X, RefreshCw, Mail, Lock, Settings2, ArrowUpDown, Upload, Sparkles } from 'lucide-react';
import { extractEmails } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { verifyEmail } from '../services/emailVerification';

interface EmailExtractorProps {
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
}

export function EmailExtractor({ userTier }: EmailExtractorProps) {
  const [source, setSource] = useState('');
  const [inputType, setInputType] = useState<'url' | 'text' | 'account' | 'file'>('url');
  const [fileContent, setFileContent] = useState('');
  const [showDirectory, setShowDirectory] = useState(false);
  const [accConfig, setAccConfig] = useState({ provider: 'gmail', email: '', password: '', customImap: '' });
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'alpha' | 'domain' | 'length'>('alpha');
  const [viewMode, setViewMode] = useState<'report' | 'list'>('report');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [groupTag, setGroupTag] = useState('');
  const [verifications, setVerifications] = useState<Record<string, { status: string, score: number, loading: boolean }>>({});
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);

  const extractedEmailsList = useMemo(() => {
    if (!result) return [];
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = result.match(emailRegex);
    let list = matches ? Array.from(new Set(matches)) : [];

    // Sorting Engine
    if (sortOrder === 'alpha') {
      list.sort((a, b) => a.localeCompare(b));
    } else if (sortOrder === 'domain') {
      list.sort((a, b) => {
        const domA = a.split('@')[1] || '';
        const domB = b.split('@')[1] || '';
        return domA.localeCompare(domB);
      });
    } else if (sortOrder === 'length') {
      list.sort((a, b) => a.length - b.length);
    }
    
    return list;
  }, [result, sortOrder]);

  const handleExtract = async () => {
    if (inputType !== 'account' && inputType !== 'file' && !source.trim()) return;
    if (inputType === 'file' && !fileContent.trim()) return;
    if (inputType === 'account' && (!accConfig.email || !accConfig.password)) return;

    setIsExtracting(true);
    setResult(null);
    setProgress(0);
    setSaveSuccess(false);
    setVerifications({});

    const steps = [
      { p: 15, s: inputType === 'url' ? 'Connecting to server...' : inputType === 'text' ? 'Analyzing text structure...' : inputType === 'file' ? 'Reading provided buffer...' : `Authenticating with ${accConfig.provider}...` },
      { p: 30, s: inputType === 'url' ? 'Fetching page content...' : inputType === 'text' ? 'Scanning for patterns...' : inputType === 'file' ? 'De-structuring intelligence file...' : 'Scanning mailbox intelligence...' },
      { p: 50, s: 'Ultrasnipps is identifying email addresses...' },
      { p: 70, s: 'Verifying domain deliverability...' },
      { p: 85, s: 'Discovering social profiles...' },
      { p: 95, s: 'Finalizing intelligence report...' }
    ];

    for (const step of steps) {
      setStatus(step.s);
      setProgress(step.p);
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
    }

    try {
      let content = '';
      if (inputType === 'account') {
        const res = await fetch('/api/extract-from-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...accConfig, type: 'email' })
        });
        const data = await res.json();
        if (data.results) {
          content = data.results.join('\n');
        } else {
          throw new Error(data.error || 'Account extraction failed');
        }
      } else if (inputType === 'file') {
        content = await extractEmails(fileContent, false) || '';
      } else {
        content = await extractEmails(source, inputType === 'url', isDeepScan) || '';
      }
      
      setResult(content);
      setProgress(100);
      setStatus('Extraction complete!');
      
      // Persist results for Campaign Import
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = content.match(emailRegex) || [];
      const uniqueEmails = Array.from(new Set(emails));
      localStorage.setItem('ultrasnipps_last_emails', JSON.stringify(uniqueEmails));
    } catch (error) {
      console.error(error);
      setStatus('Error during extraction.');
    } finally {
      setIsExtracting(false);
      setViewMode('report');
    }
  };

  const handleCopy = () => {
    if (result) {
      const text = viewMode === 'list' ? extractedEmailsList.join('\n') : result;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!result || !groupTag.trim()) return;
    setIsSaving(true);
    
    // Simulate API call to save recipients
    await new Promise(r => setTimeout(r, 1500));
    
    setIsSaving(false);
    setSaveSuccess(true);
    setGroupTag('');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleVerifyEmail = async (email: string) => {
    setVerifications(prev => ({ ...prev, [email]: { status: 'unknown', score: 0, loading: true } }));
    try {
      const res = await verifyEmail(email);
      if (res.data) {
        setVerifications(prev => ({
          ...prev,
          [email]: { status: res.data!.result, score: res.data!.score, loading: false }
        }));
      } else {
        setVerifications(prev => ({ ...prev, [email]: { status: 'error', score: 0, loading: false } }));
      }
    } catch (error) {
      setVerifications(prev => ({ ...prev, [email]: { status: 'error', score: 0, loading: false } }));
    }
  };

  const handleBulkVerify = async () => {
    setIsBulkVerifying(true);
    for (const email of extractedEmailsList) {
      if (!verifications[email] || verifications[email].status === 'unknown') {
        await handleVerifyEmail(email);
      }
    }
    setIsBulkVerifying(false);
  };

  const processedEmailData = useMemo(() => {
    return extractedEmailsList.map((email, idx) => {
      const parts = email.split('@');
      const sender = parts[0] || '';
      const domain = parts[1] || '';
      
      // Infer region from TLD
      const tld = domain.split('.').pop();
      let region = 'Global';
      if (['uk', 'de', 'fr', 'it', 'es'].includes(tld || '')) region = 'Europe';
      if (['ng', 'za', 'ke'].includes(tld || '')) region = 'Africa';
      if (['cn', 'jp', 'in'].includes(tld || '')) region = 'Asia';
      if (['us', 'ca'].includes(tld || '')) region = 'North America';

      return {
        id: `email-${idx}-${email}`,
        email,
        sender,
        domain,
        region,
        status: verifications[email]?.status || 'unknown',
        score: verifications[email]?.score || 0
      };
    });
  }, [extractedEmailsList, verifications]);

  const emailColumns = [
    { key: 'email' as const, header: 'Intelligence Link', sortable: true },
    { key: 'sender' as const, header: 'Identity', sortable: true, groupable: true },
    { key: 'domain' as const, header: 'Workspace', sortable: true, groupable: true },
    { key: 'region' as const, header: 'Geographic Region', sortable: true, groupable: true },
    { 
      key: 'status' as const, 
      header: 'Integrity', 
      sortable: true, 
      groupable: true,
      render: (item: any) => (
        <div className={cn(
          "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
          item.status === 'deliverable' ? "text-emerald-600" :
          item.status === 'risky' ? "text-amber-600" : 
          item.status === 'unknown' ? "text-slate-400" : "text-rose-600"
        )}>
          {item.status === 'deliverable' && <CheckCircle2 className="w-3 h-3" />}
          {item.status} ({item.score}%)
        </div>
      )
    }
  ];

  return (
    <div className="space-y-12">
      <div className="glass-panel rounded-[2.5rem] p-12 relative overflow-hidden group">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-6 border border-amber-500/20">
            <Search className="w-3 h-3" />
            Data Intelligence
          </div>
          <h2 className="text-6xl font-bold mb-8 leading-[1.1] tracking-tight text-glow text-slate-900">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-sky-500">Email Extractor</span> Engine.
          </h2>
          <p className="text-slate-500 text-xl leading-relaxed mb-0 font-medium">
            Quickly identify and extract email addresses from public web pages or blocks of text. 
            Ultrasnipps will scan the content and provide a clean list for your outreach.
          </p>
        </div>
        <Search className="absolute right-10 top-10 w-32 h-32 text-slate-900/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-3xl space-y-8">
            <div className="flex p-1 bg-black/5 rounded-2xl border border-black/5">
              <button
                onClick={() => setInputType('url')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                  inputType === 'url' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                URL
              </button>
              <button
                onClick={() => setInputType('text')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                  inputType === 'text' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Text
              </button>
              <button
                onClick={() => setInputType('account')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                  inputType === 'account' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Mail className="w-3.5 h-3.5" />
                Account
              </button>
              <button
                onClick={() => setInputType('file')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                  inputType === 'file' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                File
              </button>
            </div>

            {inputType === 'file' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <FileUploadUnit 
                  onFileLoaded={(content) => setFileContent(content)}
                  onClear={() => setFileContent('')}
                />
              </div>
            )}

            {inputType === 'account' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Provider</label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setInputType('file')}
                        className="text-[9px] font-bold text-amber-500 hover:text-amber-600 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <Upload className="w-3 h-3" />
                        Bulk Import
                      </button>
                      <button 
                        onClick={() => setShowDirectory(true)}
                        className="text-[10px] font-bold text-amber-500 hover:text-amber-600 transition-colors uppercase tracking-widest"
                      >
                        Not Listed?
                      </button>
                    </div>
                  </div>
                  <select 
                    value={accConfig.provider}
                    onChange={(e) => setAccConfig(prev => ({ ...prev, provider: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <optgroup label="Primary Providers">
                      <option value="gmail">Google Mail</option>
                      <option value="outlook">Outlook / Hotmail</option>
                      <option value="yahoo">Yahoo Mail</option>
                      <option value="icloud">Apple iCloud</option>
                    </optgroup>
                    {showAllProviders && (
                      <optgroup label="Global Providers">
                        <option value="protonmail">ProtonMail</option>
                        <option value="zoho">Zoho Mail</option>
                        <option value="gmx">GMX Mail</option>
                        <option value="mailru">Mail.ru</option>
                        <option value="yandex">Yandex Mail</option>
                        <option value="aol">AOL Mail</option>
                        <option value="fastmail">Fastmail</option>
                        <option value="tutanota">Tutanota</option>
                        <option value="skiff">Skiff Mail</option>
                        <option value="naver">Naver Mail</option>
                        <option value="163">NetEase 163</option>
                        <option value="rediff">Rediffmail</option>
                        <option value="rackspace">Rackspace</option>
                      </optgroup>
                    )}
                    {accConfig.provider && !['gmail', 'outlook', 'yahoo', 'icloud', 'protonmail', 'zoho', 'gmx', 'mailru', 'yandex', 'aol', 'fastmail', 'tutanota', 'skiff', 'naver', '163', 'rediff', 'rackspace', 'custom'].includes(accConfig.provider) && (
                      <optgroup label="Selected Intelligence">
                        <option value={accConfig.provider}>{accConfig.provider.toUpperCase()}</option>
                      </optgroup>
                    )}
                    <option value="custom">Custom IMAP / Other</option>
                  </select>
                </div>
                
                {accConfig.provider === 'custom' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">IMAP Server</label>
                    <div className="relative">
                      <Settings2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="text"
                        value={accConfig.customImap}
                        onChange={(e) => setAccConfig(prev => ({ ...prev, customImap: e.target.value }))}
                        placeholder="imap.yourserver.com"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="email"
                      value={accConfig.email}
                      onChange={(e) => setAccConfig(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g., john@gmail.com"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Password / App Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="password"
                      value={accConfig.password}
                      onChange={(e) => setAccConfig(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••••••"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-500 leading-tight">
                    For security, use an <strong>App Password</strong> if your provider requires 2FA. We never store these credentials.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-slate-400 mb-3 block uppercase tracking-widest flex items-center justify-between">
                  <span>{inputType === 'url' ? "Enter Public URL" : "Paste Text Content"}</span>
                  <button 
                    onClick={() => setInputType('file')}
                    className="text-[9px] font-bold text-amber-600/60 hover:text-amber-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    {inputType === 'url' ? "Upload URL List" : "Upload File"}
                  </button>
                </label>
                <textarea
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder={inputType === 'url' ? "https://example.com/contact" : "Paste your text here..."}
                  className="w-full p-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-amber-500/50 outline-none h-40 text-sm text-slate-900 font-mono placeholder:text-slate-300 transition-all"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-white/40 border border-black/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 rounded-lg">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Deep Scan Mode</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Enhanced Intelligence</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeepScan(!isDeepScan)}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative",
                  isDeepScan ? "bg-sky-500" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                  isDeepScan ? "left-6" : "left-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/40 border border-black/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 rounded-lg">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Deep Scan Mode</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Enhanced Intelligence</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeepScan(!isDeepScan)}
                className={cn(
                  "w-10 h-5 rounded-full transition-all relative",
                  isDeepScan ? "bg-sky-500" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                  isDeepScan ? "left-6" : "left-1"
                )} />
              </button>
            </div>

            <button
              onClick={handleExtract}
              disabled={isExtracting || (inputType === 'file' && !fileContent.trim()) || (inputType !== 'account' && inputType !== 'file' && !source.trim()) || (inputType === 'account' && (!accConfig.email || !accConfig.password))}
              className="w-full flex items-center justify-center gap-3 bg-amber-500 text-white py-4 rounded-2xl font-bold hover:bg-amber-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20"
            >
              {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {inputType === 'account' ? 'Index Mailbox' : 'Extract Emails'}
            </button>
          </div>

          {isExtracting && (
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                <span className="text-slate-400 uppercase tracking-widest">{status}</span>
                <span className="text-amber-600">{progress}%</span>
              </div>
              <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-rose-500/5 p-6 rounded-2xl border border-rose-500/10">
            <h4 className="font-bold text-rose-600 mb-2 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4" />
              Privacy Notice
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Only extract emails from public sources where you have a legitimate reason to contact. 
              Always respect privacy laws (GDPR, CAN-SPAM) and platform terms of service.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {result ? (
            <>
              <div className="glass-panel rounded-3xl overflow-hidden flex flex-col min-h-[400px] mb-8">
                <div className="p-6 border-b border-black/5 bg-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-black/5 pr-4">Output Module</span>
                    
                    <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl">
                      <button 
                        onClick={() => setViewMode('report')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all",
                          viewMode === 'report' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        AI Report
                      </button>
                      <div className="w-px h-4 bg-black/10 mx-1" />
                      <button 
                        onClick={() => { setSortOrder('alpha'); setViewMode('list'); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1.5",
                          viewMode === 'list' && sortOrder === 'alpha' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        Alpha
                      </button>
                      <button 
                        onClick={() => { setSortOrder('domain'); setViewMode('list'); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1.5",
                          viewMode === 'list' && sortOrder === 'domain' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        <Settings2 className="w-3 h-3" />
                        Domain
                      </button>
                      <button 
                        onClick={() => { setSortOrder('length'); setViewMode('list'); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1.5",
                          viewMode === 'list' && sortOrder === 'length' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        Size
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy List
                      </>
                    )}
                  </button>
                </div>
                <div className="p-10 flex-1 overflow-y-auto prose prose-slate max-w-none">
                  {viewMode === 'report' ? (
                    <ReactMarkdown>{result}</ReactMarkdown>
                  ) : (
                    <div className="not-prose -m-10">
                      <SortingUnit 
                        data={processedEmailData}
                        columns={emailColumns}
                        title="Intelligent Email Stream"
                        type="email"
                        userTier={userTier}
                      />
                    </div>
                  )}
                </div>
              </div>

              {extractedEmailsList.length > 0 && (
                <div className="glass-panel p-8 rounded-[2rem] space-y-6 border-black/5 bg-white/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-sky-500" />
                      <h3 className="font-bold text-slate-900 text-lg tracking-tight">Email Verification</h3>
                    </div>
                    <button
                      onClick={handleBulkVerify}
                      disabled={isBulkVerifying}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
                    >
                      {isBulkVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Verify All Leads
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extractedEmailsList.map(email => (
                      <div key={email} className="flex items-center justify-between p-4 bg-white/60 border border-black/5 rounded-2xl group/item">
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <span className="text-sm font-mono text-slate-900 truncate">{email}</span>
                          {verifications[email] && !verifications[email].loading && (
                            <div className={cn(
                              "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1",
                              verifications[email].status === 'deliverable' ? "text-emerald-600" :
                              verifications[email].status === 'risky' ? "text-amber-600" : "text-rose-600"
                            )}>
                              {verifications[email].status} ({verifications[email].score}%)
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {verifications[email]?.loading ? (
                            <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                          ) : verifications[email] ? (
                            verifications[email].status === 'deliverable' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : verifications[email].status === 'risky' ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            ) : (
                              <X className="w-5 h-5 text-rose-500" />
                            )
                          ) : (
                            <button
                              onClick={() => handleVerifyEmail(email)}
                              className="p-2 text-slate-300 hover:text-sky-500 hover:bg-sky-500/10 rounded-xl transition-all opacity-0 group-hover/item:opacity-100"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass-panel p-10 rounded-[2rem] space-y-6 border-amber-500/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg tracking-tight">Save to Recipients</h4>
                    <p className="text-sm text-slate-400">Add these emails to your recipient list with a custom tag.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={groupTag}
                    onChange={(e) => setGroupTag(e.target.value)}
                    placeholder="e.g., Tech Leads, Newsletter"
                    className="flex-1 px-6 py-4 bg-white/60 border border-black/5 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-300"
                  />
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !groupTag.trim() || saveSuccess}
                    className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-bold text-sm hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg shadow-amber-500/20"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {saveSuccess ? 'Saved!' : 'Save Group'}
                  </button>
                </div>
                {saveSuccess && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Emails successfully added to your Recipients list.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white/40 rounded-[2rem] border-2 border-dashed border-black/5 h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-white/60 rounded-3xl flex items-center justify-center mb-8 border border-black/5">
                <Search className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Ready to Scan</h3>
              <p className="text-slate-400 max-w-xs leading-relaxed">
                Provide a URL or text to find email addresses. Ultrasnipps will do the heavy lifting.
              </p>
            </div>
          )}
        </div>
      </div>
      <ProviderDirectory 
        isOpen={showDirectory}
        onClose={() => setShowDirectory(false)}
        onSelect={(p) => {
          setAccConfig(prev => ({ ...prev, provider: p }));
          if (!['gmail', 'outlook', 'yahoo', 'icloud'].includes(p)) {
            setShowAllProviders(true);
          }
        }}
      />
    </div>
  );
}
