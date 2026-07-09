import React, { useState, useMemo } from 'react';
import { SortingUnit } from './SortingUnit';
import { FileUploadUnit } from './FileUploadUnit';
import { ProviderDirectory } from './ProviderDirectory';
import { Search, Loader2, Link as LinkIcon, FileText, Copy, CheckCircle2, AlertTriangle, ShieldAlert, Users, Plus, ShieldCheck, X, RefreshCw, Phone, Globe, Filter, ListFilter, Crown, Mail, Lock, Settings2, ArrowUpDown, Upload, Sparkles } from 'lucide-react';
import { extractEmails, extractMobileNumbers } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

interface MobileExtractorProps {
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
}

export function MobileExtractor({ userTier }: MobileExtractorProps) {
  const [source, setSource] = useState('');
  const [inputType, setInputType] = useState<'url' | 'text' | 'account' | 'file'>('url');
  const [fileContent, setFileContent] = useState('');
  const [showDirectory, setShowDirectory] = useState(false);
  const [accConfig, setAccConfig] = useState({ provider: 'gmail', email: '', password: '', customDomain: '' });
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'num' | 'country' | 'carrier'>('num');
  const [viewMode, setViewMode] = useState<'report' | 'list'>('report');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeepScan, setIsDeepScan] = useState(false);
  const [groupTag, setGroupTag] = useState('');
  const [lookups, setLookups] = useState<Record<string, { carrier: string, country: string, loading: boolean, error?: string }>>({});
  const [isBulkLookingUp, setIsBulkLookingUp] = useState(false);
  const [filterCarrier, setFilterCarrier] = useState('');
  const [filterCountry, setFilterCountry] = useState('');

  const isKnightOrHigher = userTier !== 'page';
  const isDukeOrHigher = userTier === 'duke' || userTier === 'monarch' || userTier === 'emperor';

  const extractedNumbersList = useMemo(() => {
    if (!result) return [];
    // Basic regex for phone numbers, will be refined by libphonenumber
    const phoneRegex = /\+?\d{7,15}/g;
    const matches = result.match(phoneRegex);
    if (!matches) return [];

    const uniqueNumbers = Array.from(new Set(matches));
    const normalizedNumbers = uniqueNumbers.map(num => {
      try {
        const parsed = phoneUtil.parse(num, 'US'); // Default to US if no prefix
        if (phoneUtil.isValidNumber(parsed)) {
          return phoneUtil.format(parsed, PhoneNumberFormat.E164);
        }
      } catch (e) {
        // Ignore invalid numbers
      }
      return null;
    }).filter(Boolean) as string[];

    return Array.from(new Set(normalizedNumbers));
  }, [result]);

  const filteredNumbers = useMemo(() => {
    let list = extractedNumbersList.filter(num => {
      const lookup = lookups[num];
      const matchesCarrier = !filterCarrier || (lookup?.carrier?.toLowerCase().includes(filterCarrier.toLowerCase()));
      const matchesCountry = !filterCountry || (lookup?.country?.toLowerCase() === filterCountry.toLowerCase());
      return matchesCarrier && matchesCountry;
    });

    // Sorting Engine
    if (sortOrder === 'num') {
      list.sort((a, b) => a.localeCompare(b));
    } else if (sortOrder === 'country') {
      list.sort((a, b) => {
        const countryA = lookups[a]?.country || '';
        const countryB = lookups[b]?.country || '';
        return countryA.localeCompare(countryB);
      });
    } else if (sortOrder === 'carrier') {
      list.sort((a, b) => {
        const carrierA = lookups[a]?.carrier || '';
        const carrierB = lookups[b]?.carrier || '';
        return carrierA.localeCompare(carrierB);
      });
    }

    return list;
  }, [extractedNumbersList, lookups, filterCarrier, filterCountry, sortOrder]);

  const handleExtract = async () => {
    if (inputType !== 'account' && inputType !== 'file' && !source.trim()) return;
    if (inputType === 'file' && !fileContent.trim()) return;
    if (inputType === 'account' && (!accConfig.email || !accConfig.password)) return;

    setIsExtracting(true);
    setResult(null);
    setProgress(0);
    setSaveSuccess(false);
    setLookups({});

    const steps = [
      { p: 15, s: inputType === 'url' ? 'Connecting to global gateways...' : inputType === 'text' ? 'Analyzing text structure...' : inputType === 'file' ? 'Opening specialized buffer...' : `Connecting to ${accConfig.provider} Contact Store...` },
      { p: 30, s: inputType === 'url' ? 'Fetching page content...' : inputType === 'text' ? 'Scanning for numeric patterns...' : inputType === 'file' ? 'Harvesting signal intelligence...' : 'Harvesting contact intelligence...' },
      { p: 50, s: 'Ultrasnipps is identifying international formats...' },
      { p: 70, s: 'Normalizing to E.164 standard...' },
      { p: 85, s: 'Mapping regional prefixes...' },
      { p: 95, s: 'Finalizing intelligence report...' }
    ];

    for (const step of steps) {
      setStatus(step.s);
      setProgress(step.p);
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    }

    try {
      let content = '';
      if (inputType === 'account') {
        const res = await fetch('/api/extract-from-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...accConfig, type: 'mobile' })
        });
        const data = await res.json();
        if (data.results) {
          content = data.results.join('\n');
        } else {
          throw new Error(data.error || 'Account extraction failed');
        }
      } else if (inputType === 'file') {
        content = await extractMobileNumbers(fileContent, false, isDeepScan) || '';
      } else {
        content = await extractMobileNumbers(source, inputType === 'url', isDeepScan) || '';
      }
      
      setResult(content);
      setProgress(100);
      setStatus('Extraction complete!');

      // Persist results for Campaign Import
      const phoneRegex = /\+?\d{7,15}/g;
      const matches = content.match(phoneRegex) || [];
      const uniqueNumbers = Array.from(new Set(matches));
      const normalized = uniqueNumbers.map(num => {
        try {
          const parsed = phoneUtil.parse(num, 'US');
          return phoneUtil.isValidNumber(parsed) ? phoneUtil.format(parsed, PhoneNumberFormat.E164) : null;
        } catch (e) { return null; }
      }).filter(Boolean);
      localStorage.setItem('ultrasnipps_last_phones', JSON.stringify(Array.from(new Set(normalized))));
    } catch (error) {
      console.error(error);
      setStatus('Error during extraction.');
    } finally {
      setIsExtracting(false);
      setViewMode('report');
    }
  };

  const handleLookup = async (number: string) => {
    if (!isKnightOrHigher) return;
    
    setLookups(prev => ({ ...prev, [number]: { carrier: '', country: '', loading: true } }));
    try {
      const res = await fetch('/api/lookup-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: number }),
      });
      const data = await res.json();
      if (data.carrier) {
        setLookups(prev => ({
          ...prev,
          [number]: { 
            carrier: data.carrier.name || 'Unknown', 
            country: data.countryCode || 'Unknown', 
            loading: false 
          }
        }));
      } else {
        setLookups(prev => ({ ...prev, [number]: { carrier: 'N/A', country: 'N/A', loading: false, error: data.error } }));
      }
    } catch (error) {
      setLookups(prev => ({ ...prev, [number]: { carrier: 'Error', country: 'Error', loading: false } }));
    }
  };

  const handleBulkLookup = async () => {
    if (!isKnightOrHigher) return;
    setIsBulkLookingUp(true);
    for (const num of extractedNumbersList) {
      if (!lookups[num] || lookups[num].carrier === '') {
        await handleLookup(num);
      }
    }
    setIsBulkLookingUp(false);
  };

  const handleCopy = () => {
    if (result) {
      const text = viewMode === 'list' ? filteredNumbers.join('\n') : result;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (filteredNumbers.length === 0 || !groupTag.trim()) return;
    setIsSaving(true);
    
    // Simulate API call to save recipients
    await new Promise(r => setTimeout(r, 1500));
    
    setIsSaving(false);
    setSaveSuccess(true);
    setGroupTag('');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const countries = useMemo(() => {
    const set = new Set<string>();
    Object.values(lookups).forEach(l => {
      if (l.country && l.country !== 'Unknown') set.add(l.country);
    });
    return Array.from(set).sort();
  }, [lookups]);

  const processedMobileData = useMemo(() => {
    return extractedNumbersList.map((num, idx) => {
      const lookup = lookups[num];
      let status = 'Unknown';
      if (lookup?.carrier && lookup.carrier !== 'Unknown') status = 'Verified';
      if (lookup?.error) status = 'Invalid';

      return {
        id: `mobile-${idx}-${num}`,
        number: num,
        carrier: lookup?.carrier || 'Unknown',
        country: lookup?.country || 'Unknown',
        status,
        countryCode: num.slice(0, 3) // Simple country code extraction
      };
    });
  }, [extractedNumbersList, lookups]);

  const mobileColumns = [
    { key: 'number' as const, header: 'Signal ID', sortable: true },
    { key: 'countryCode' as const, header: 'Global Prefix', sortable: true, groupable: true },
    { key: 'carrier' as const, header: 'Network Channel', sortable: true, groupable: true },
    { key: 'country' as const, header: 'Region', sortable: true, groupable: true },
    { 
      key: 'status' as const, 
      header: 'Intelligence State', 
      sortable: true, 
      groupable: true,
      render: (item: any) => (
        <div className={cn(
          "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5",
          item.status === 'Verified' ? "text-emerald-600" :
          item.status === 'Invalid' ? "text-rose-600" : "text-slate-400"
        )}>
          {item.status === 'Verified' && <CheckCircle2 className="w-3 h-3" />}
          {item.status}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-12">
      <div className="glass-panel rounded-[2.5rem] p-12 relative overflow-hidden group">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 text-xs font-bold uppercase tracking-widest mb-6 border border-sky-500/20">
            <Globe className="w-3 h-3" />
            Global Intelligence
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 leading-[1.1] tracking-tight text-glow text-slate-900">
            Worldwide <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-amber-500">Mobile Extractor</span>.
          </h2>
          <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-0 font-medium">
            Extract, normalize, and identify mobile numbers from any source worldwide. 
            Ultrasnipps automatically detects carriers and regions to optimize your global SMS outreach.
          </p>
        </div>
        <Phone className="absolute right-10 top-10 w-32 h-32 text-slate-900/5 rotate-12" />
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
                <LinkIcon className="w-4 h-4" />
                URL
              </button>
              <button
                onClick={() => setInputType('text')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                  inputType === 'text' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <FileText className="w-4 h-4" />
                Text
              </button>
              <button
                onClick={() => setInputType('account')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                  inputType === 'account' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Mail className="w-4 h-4" />
                Account
              </button>
              <button
                onClick={() => setInputType('file')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                  inputType === 'file' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Upload className="w-4 h-4" />
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
                        className="text-[9px] font-bold text-sky-500 hover:text-sky-600 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <Upload className="w-3 h-3" />
                        Bulk Import
                      </button>
                      <button 
                        onClick={() => setShowDirectory(true)}
                        className="text-[10px] font-bold text-sky-500 hover:text-sky-600 transition-colors uppercase tracking-widest"
                      >
                        Not Listed?
                      </button>
                    </div>
                  </div>
                  <select 
                    value={accConfig.provider}
                    onChange={(e) => setAccConfig(prev => ({ ...prev, provider: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/50"
                  >
                    <optgroup label="Primary Stores">
                      <option value="gmail">Google Store</option>
                      <option value="outlook">Outlook Contacts</option>
                      <option value="yahoo">Yahoo Contacts</option>
                      <option value="icloud">Apple Contacts</option>
                    </optgroup>
                    {showAllProviders && (
                      <optgroup label="Global Directories">
                        <option value="zoho">Zoho CRM</option>
                        <option value="salesforce">Salesforce</option>
                        <option value="hubspot">HubSpot</option>
                        <option value="protonmail">Proton Contacts</option>
                        <option value="yandex">Yandex Connect</option>
                        <option value="naver">Naver Contacts</option>
                        <option value="daum">Daum Contacts</option>
                        <option value="163">163 Mail contacts</option>
                      </optgroup>
                    )}
                    {accConfig.provider && !['gmail', 'outlook', 'yahoo', 'icloud', 'zoho', 'salesforce', 'hubspot', 'protonmail', 'yandex', 'naver', 'daum', '163', 'custom'].includes(accConfig.provider) && (
                      <optgroup label="Selected intelligence">
                        <option value={accConfig.provider}>{accConfig.provider.toUpperCase()}</option>
                      </optgroup>
                    )}
                    <option value="custom">Other / Custom Domain</option>
                  </select>
                </div>

                {accConfig.provider === 'custom' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Custom Domain / Server</label>
                    <div className="relative">
                      <Settings2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="text"
                        value={accConfig.customDomain}
                        onChange={(e) => setAccConfig(prev => ({ ...prev, customDomain: e.target.value }))}
                        placeholder="contacts.yourdomain.com"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/50"
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
                      className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/50"
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
                      className="w-full pl-12 pr-4 py-3 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/50"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-400 mb-3 block uppercase tracking-widest flex items-center justify-between">
                  <span>{inputType === 'url' ? "Enter Public URL" : "Paste Text Content"}</span>
                  <button 
                    onClick={() => setInputType('file')}
                    className="text-[9px] font-bold text-sky-600/60 hover:text-sky-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    {inputType === 'url' ? "Upload URL List" : "Upload File"}
                  </button>
                </label>
                <textarea
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder={inputType === 'url' ? "https://example.com/contact" : "Paste your text here..."}
                  className="w-full p-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sky-500/50 outline-none h-40 text-sm text-slate-900 font-mono placeholder:text-slate-300 transition-all"
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
              className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-4 rounded-2xl font-bold hover:bg-sky-600 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/20"
            >
              {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {inputType === 'account' ? 'Sync Contacts' : 'Extract Numbers'}
            </button>
          </div>

          {isExtracting && (
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-400 uppercase tracking-widest">{status}</span>
                <span className="text-sky-600">{progress}%</span>
              </div>
              <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-sky-500 h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10">
            <h4 className="font-bold text-amber-600 mb-2 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4" />
              Global Compliance
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ensure you have consent before contacting mobile numbers. 
              Follow TCPA (USA), GDPR (EU), and local telecom regulations for SMS outreach.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {result ? (
            <>
              <div className="glass-panel rounded-3xl overflow-hidden flex flex-col min-h-[400px] mb-8">
                <div className="p-6 border-b border-black/5 bg-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest border-r border-black/5 pr-6">Output Module</span>
                    
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
                        onClick={() => { setSortOrder('num'); setViewMode('list'); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1.5",
                          viewMode === 'list' && sortOrder === 'num' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        <ArrowUpDown className="w-3 h-3" />
                        Value
                      </button>
                      <button 
                        onClick={() => { setSortOrder('country'); setViewMode('list'); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1.5",
                          viewMode === 'list' && sortOrder === 'country' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        <Globe className="w-3 h-3" />
                        Region
                      </button>
                      <button 
                        onClick={() => { setSortOrder('carrier'); setViewMode('list'); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1.5",
                          viewMode === 'list' && sortOrder === 'carrier' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
                        )}
                      >
                        <Settings2 className="w-3 h-3" />
                        Network
                      </button>
                    </div>

                    {isDukeOrHigher && (
                      <div className="flex items-center gap-4 border-l border-black/5 pl-6">
                        <div className="flex items-center gap-2">
                          <Filter className="w-3.5 h-3.5 text-slate-300" />
                          <input 
                            type="text"
                            placeholder="Filter Carrier..."
                            value={filterCarrier}
                            onChange={(e) => setFilterCarrier(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-600 outline-none placeholder:text-slate-300 w-24"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-slate-300" />
                          <select 
                            value={filterCountry}
                            onChange={(e) => setFilterCountry(e.target.value)}
                            className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                          >
                            <option value="">All Countries</option>
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
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
                        data={processedMobileData}
                        columns={mobileColumns}
                        title="Mobile Intelligence Cluster"
                        type="mobile"
                        userTier={userTier}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-panel p-8 rounded-[2rem] space-y-6 border-black/5 bg-white/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-sky-500" />
                    <h3 className="font-bold text-slate-900 text-lg tracking-tight">Carrier Identification</h3>
                  </div>
                  <button
                    onClick={handleBulkLookup}
                    disabled={isBulkLookingUp || !isKnightOrHigher}
                    className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-2xl text-xs font-bold hover:bg-sky-600 transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
                  >
                    {isBulkLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListFilter className="w-4 h-4" />}
                    Identify All Carriers
                  </button>
                </div>
                {!isKnightOrHigher && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <p className="text-xs text-amber-700 font-bold">
                      Upgrade to Knight rank to unlock global carrier identification.
                    </p>
                  </div>
                )}
              </div>
              <div className="glass-panel p-10 rounded-[2rem] space-y-6 border-sky-500/20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-500/20">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg tracking-tight">Save to Recipients</h4>
                    <p className="text-sm text-slate-400">Add these numbers to your recipient list with a custom tag.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={groupTag}
                    onChange={(e) => setGroupTag(e.target.value)}
                    placeholder="e.g., SMS Leads, Mobile Contacts"
                    className="flex-1 px-6 py-4 bg-white/60 border border-black/5 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-sky-500/50 outline-none transition-all placeholder:text-slate-300"
                  />
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !groupTag.trim() || saveSuccess || filteredNumbers.length === 0}
                    className="px-10 py-4 bg-sky-500 text-white rounded-2xl font-bold text-sm hover:bg-sky-600 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg shadow-sky-500/20"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {saveSuccess ? 'Saved!' : 'Save Group'}
                  </button>
                </div>
                {saveSuccess && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Mobile numbers successfully added to your Recipients list.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white/40 rounded-[2rem] border-2 border-dashed border-black/5 h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-white/60 rounded-3xl flex items-center justify-center mb-8 border border-black/5">
                <Phone className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Ready to Scan</h3>
              <p className="text-slate-400 max-w-xs leading-relaxed">
                Provide a URL or text to find mobile numbers worldwide. Ultrasnipps will normalize and identify them for you.
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
        title="Intelligence Library: Global Directories"
      />
    </div>
  );
}
