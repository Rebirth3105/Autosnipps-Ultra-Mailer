import React, { useState, useMemo } from 'react';
import { Search, Loader2, Link as LinkIcon, FileText, Copy, CheckCircle2, Globe, ArrowUpDown, ChevronDown, FileDown, UserCircle, MapPin, Phone, Target } from 'lucide-react';
import { performTaskExtraction, ExtractionTask } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface TaskExtractorProps {
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
}

export function TaskExtractor({ userTier }: TaskExtractorProps) {
  const [url, setUrl] = useState('');
  const [task, setTask] = useState<ExtractionTask>('pdf');
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [sortMode, setSortMode] = useState<'domain' | 'alpha'>('domain');

  const tasks = [
    { id: 'pdf', label: 'Extract PDF Files', icon: FileDown, description: 'Find all PDF links on the page' },
    { id: 'account', label: 'Extract Account Details', icon: UserCircle, description: 'Identify usernames, roles, and profiles' },
    { id: 'phone', label: 'Extract Phone Numbers', icon: Phone, description: 'Scrape contact numbers' },
    { id: 'address', label: 'Extract Addresses', icon: MapPin, description: 'Find physical locations' },
  ] as const;

  const activeTask = tasks.find(t => t.id === task);

  const handleExtract = async () => {
    let formattedUrl = url.trim();
    if (!formattedUrl) return;
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    setIsExtracting(true);
    setResult(null);
    setProgress(0);

    const steps = [
      { p: 20, s: 'Establishing secure link intelligence...' },
      { p: 40, s: `Scanning target for ${activeTask?.label.toLowerCase()}...` },
      { p: 70, s: 'Ultrasnipps AI is parsing structured data...' },
      { p: 90, s: 'Applying sorting and grouping filters...' }
    ];

    for (const step of steps) {
      if (step.p > 90) break;
      setStatus(step.s);
      setProgress(step.p);
      await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    }

    try {
      setStatus('Ultrasnipps AI is synthesizing intelligence report...');
      setProgress(95);
      const content = await performTaskExtraction(formattedUrl, task, sortMode);
      
      if (!content || content.trim().length === 0) {
        setResult('### No specific data found\n\nThe AI scanned the destination but could not find specific matches for the requested task. This can happen if the site requires login, blocks scrapers, or simply does not contain the requested information.');
      } else {
        setResult(content);
      }
      setProgress(100);
      setStatus('Intelligence extraction complete!');
    } catch (error) {
      console.error(error);
      setStatus('Extraction failed. AI node reported a network timeout or access denial.');
      setProgress(0);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-12">
      <div className="glass-panel rounded-[2.5rem] p-12 relative overflow-hidden group">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-6 border border-indigo-500/20">
            <Search className="w-3 h-3" />
            Adaptive Intelligence
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-[1.1] tracking-tight text-glow text-slate-900">
            Unified <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-amber-500">Task Extractor</span>.
          </h2>
          <p className="text-slate-500 text-xl leading-relaxed mb-0 font-medium">
            Paste a link and choose your mission. Ultrasnipps will deep-scan the destination for PDFs, accounts, phone numbers, or addresses.
          </p>
        </div>
        <Globe className="absolute right-10 top-10 w-32 h-32 text-indigo-900/5 hover:rotate-45 transition-transform duration-1000" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-3xl space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Target Intelligence Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                <input 
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/data"
                  className="w-full pl-12 pr-4 py-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm text-slate-900 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-3 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Extraction Mission</label>
              <button 
                type="button"
                onClick={() => setShowTaskDropdown(!showTaskDropdown)}
                className="w-full flex items-center justify-between p-4 bg-white/60 border border-black/5 rounded-2xl hover:bg-white transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    {activeTask && <activeTask.icon className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{activeTask?.label}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">{activeTask?.description}</p>
                  </div>
                </div>
                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", showTaskDropdown && "rotate-180")} />
              </button>

              {showTaskDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-black/5 rounded-3xl shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                  {tasks.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => { setTask(t.id); setShowTaskDropdown(false); }}
                      className={cn(
                        "w-full flex items-center gap-4 px-6 py-4 hover:bg-indigo-50/50 transition-colors text-left",
                        task === t.id && "bg-indigo-50 text-indigo-600"
                      )}
                    >
                      <t.icon className={cn("w-5 h-5", task === t.id ? "text-indigo-600" : "text-slate-400")} />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{t.label}</h4>
                        <p className="text-[10px] text-slate-400">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sorting Intelligence</label>
              <div className="flex p-1 bg-black/5 rounded-2xl border border-black/5">
                <button
                  type="button"
                  onClick={() => setSortMode('domain')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                    sortMode === 'domain' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <Globe className="w-3.5 h-3.5" />
                  By Domain
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('alpha')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold transition-all",
                    sortMode === 'alpha' ? "bg-white text-slate-900 shadow-lg" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Alphabetical
                </button>
              </div>
            </div>

            <button
              onClick={handleExtract}
              disabled={isExtracting || !url.trim()}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
            >
              {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Initiate Extraction
            </button>
          </div>

          {isExtracting && (
            <div className="glass-panel p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                <span className="text-slate-400 uppercase tracking-widest">{status}</span>
                <span className="text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full min-h-[600px]">
              <div className="p-6 border-b border-black/5 bg-white/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Extracted Intelligence</span>
                  <div className="h-4 w-px bg-black/5" />
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{task} MODE</span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest italic">Sorted: {sortMode}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Report
                    </>
                  )}
                </button>
              </div>
              <div className="p-10 flex-1 overflow-y-auto prose prose-indigo max-w-none prose-table:border prose-table:rounded-xl">
                 <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 rounded-[2rem] border-2 border-dashed border-black/5 h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-indigo-500/5 rounded-3xl flex items-center justify-center mb-8 border border-indigo-500/10">
                <Target className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Intelligence Feed Empty</h3>
              <p className="text-slate-400 max-w-xs leading-relaxed font-medium">
                Select a task, provide a link, and start the extraction process to see results here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
