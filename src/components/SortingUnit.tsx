import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ChevronDown, 
  Download, 
  Trash2, 
  ShieldOff, 
  Search, 
  Filter, 
  Tag, 
  MoreVertical,
  Briefcase,
  Globe,
  Database,
  CheckCircle2,
  ShieldCheck,
  X,
  RefreshCw,
  BarChart3,
  Sparkles,
  PieChart as PieChartIcon,
  Target,
  Loader2,
  ChevronRight,
  TrendingUp,
  Fingerprint,
  Bot
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { identifyIdealLeads, analyzeLeads } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface SortingUnitProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    groupable?: boolean;
  }[];
  onBulkAction?: (action: 'delete' | 'export' | 'tag' | 'anonymize', selectedItems: T[]) => void;
  title?: string;
  type: 'email' | 'mobile';
  userTier: string;
}

export function SortingUnit<T extends Record<string, any>>({ 
  data, 
  columns, 
  onBulkAction, 
  title, 
  type,
  userTier 
}: SortingUnitProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<keyof T | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [anonymizedIds, setAnonymizedIds] = useState<Set<string>>(new Set());
  const [sessionLogs, setSessionLogs] = useState<string[]>([]);
  const [substitutionModal, setSubstitutionModal] = useState<{
    isOpen: boolean;
    search: string;
    replace: string;
    targetColumn: keyof T | 'all';
  }>({ isOpen: false, search: '', replace: '', targetColumn: 'all' });
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<T>>>({});

  // Advanced Visuals & AI State
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showScouting, setShowScouting] = useState(false);
  const [scoutingPersona, setScoutingPersona] = useState('');
  const [scoutingResult, setScoutingResult] = useState('');
  const [isScouting, setIsScouting] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const addLog = (action: string) => {
    const time = new Date().toLocaleTimeString();
    setSessionLogs(prev => [`[${time}] ${action}`, ...prev].slice(0, 5));
  };

  const filteredData = useMemo(() => {
    let result = data.map((item, idx) => {
      const id = item.id || `node-${idx}`;
      return { ...item, id, ...(localOverrides[id] || {}) };
    }).filter(item => !removedIds.has(item.id));

    // Search
    if (searchTerm) {
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Enforce 50 limit for unpaid 'page' rank
    if (userTier === 'page') {
      result = result.slice(0, 50);
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const valA = String(a[sortKey]);
        const valB = String(b[sortKey]);
        return sortDir === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      });
    }

    return result;
  }, [data, searchTerm, sortKey, sortDir, removedIds]);

  const groupedData = useMemo(() => {
    if (!groupBy) return { 'All Results': filteredData };
    
    return filteredData.reduce((acc, item) => {
      const groupValue = String(item[groupBy]) || 'Unknown';
      if (!acc[groupValue]) acc[groupValue] = [];
      acc[groupValue].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }, [filteredData, groupBy]);

  const handleBulkAction = (action: 'delete' | 'anonymize' | 'tag') => {
    if (selectedIds.size === 0) return;

    if (action === 'delete') {
      setRemovedIds(prev => new Set([...prev, ...selectedIds]));
      addLog(`Purged ${selectedIds.size} records from cluster`);
    } else if (action === 'anonymize') {
      setAnonymizedIds(prev => new Set([...prev, ...selectedIds]));
      addLog(`Anonymized ${selectedIds.size} sensitive links`);
    } else if (action === 'tag') {
      addLog(`Applied metadata tags to ${selectedIds.size} items`);
    }
    
    setSelectedIds(new Set());
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(item => item.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    addLog(`Resorted cluster by ${String(key).toUpperCase()}`);
  };

  const handleScout = async () => {
    if (!scoutingPersona.trim()) return;
    setIsScouting(true);
    try {
      const result = await identifyIdealLeads(data, scoutingPersona);
      setScoutingResult(result);
      addLog(`AI Scouting performed for: ${scoutingPersona}`);
    } catch (error) {
      console.error("Scouting failed:", error);
    } finally {
      setIsScouting(false);
    }
  };

  const handleDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const emails = data.map((item: any) => item.email).filter(Boolean);
      const result = await analyzeLeads(emails);
      setDeepAnalysis(result);
      addLog("Deep Intelligence Analysis completed");
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartData = useMemo(() => {
    const domainCounts: Record<string, number> = {};
    const regionCounts: Record<string, number> = {};

    filteredData.forEach((item: any) => {
      const dom = item.domain || 'unknown';
      domainCounts[dom] = (domainCounts[dom] || 0) + 1;
      
      const reg = item.region || 'Unknown';
      regionCounts[reg] = (regionCounts[reg] || 0) + 1;
    });

    const domains = Object.entries(domainCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const regions = Object.entries(regionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { domains, regions };
  }, [filteredData]);

  const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#f43f5e', '#14b8a6'];

  const handleBatchSubstitute = () => {
    const { search, replace, targetColumn } = substitutionModal;
    if (!search) return;

    const newOverrides = { ...localOverrides };
    let count = 0;

    filteredData.forEach(item => {
      if (selectedIds.size > 0 && !selectedIds.has(item.id)) return;

      const keysToUpdate = targetColumn === 'all' 
        ? (columns.map(c => c.key) as (keyof T)[])
        : [targetColumn as keyof T];

      let updated = false;
      const itemUpdate: Partial<T> = newOverrides[item.id] || {};

      keysToUpdate.forEach(k => {
        const currentVal = String(item[k]);
        if (currentVal.includes(search)) {
          (itemUpdate as any)[k] = currentVal.split(search).join(replace);
          updated = true;
        }
      });

      if (updated) {
        newOverrides[item.id] = itemUpdate;
        count++;
      }
    });

    setLocalOverrides(newOverrides);
    setSubstitutionModal(prev => ({ ...prev, isOpen: false, search: '', replace: '' }));
    addLog(`Advanced Batch Substitute: ${count} nodes modified`);
  };

  const exportToCSV = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = filteredData.map(item => 
      columns.map(c => {
        const id = item.id || Object.values(item).join('_');
        if (anonymizedIds.has(id)) return '[SENSITIVE/HIDDEN]';
        return `"${String(item[c.key]).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    
    const csvContent = headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title?.replace(/\s+/g, '_') || 'export'}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addLog(`Exported ${filteredData.length} records via Secure Blob`);
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden border border-black/5 bg-white/40 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header / Controls */}
      <div className="p-8 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 text-glow">
            <Database className="w-5 h-5 text-amber-500" />
            {title || 'Sorting Engine'}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Analyzing {filteredData.length} active intelligence records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
            <input 
              type="text"
              placeholder="Deep Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white/60 border border-black/5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500/30 w-48"
            />
          </div>

          <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl">
            <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-slate-400 border-r border-black/5 uppercase tracking-widest">
              <Filter className="w-3 h-3" />
              Categorize
            </div>
            <select 
              value={groupBy as string || ''}
              onChange={(e) => {
                const val = e.target.value as keyof T || null;
                setGroupBy(val);
                if (val) addLog(`Categorized intelligence by ${String(val).toUpperCase()}`);
              }}
              className="bg-transparent text-[10px] font-bold text-slate-600 outline-none pr-4 cursor-pointer"
            >
              <option value="">Linear View</option>
              {columns.filter(c => c.groupable).map(c => (
                <option key={String(c.key)} value={String(c.key)}>{c.header}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg hover:bg-black active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Harvest Results
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-slate-900 p-3 px-8 flex items-center justify-between animate-in slide-in-from-top-6 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              {selectedIds.size} nodes locked in command buffer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleBulkAction('tag')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black transition-all uppercase tracking-widest border border-white/5"
            >
              <Tag className="w-3 h-3 text-sky-400" /> Tag Selection
            </button>
            <button 
              onClick={() => setSubstitutionModal(prev => ({ ...prev, isOpen: true }))}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/40 text-sky-400 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest border border-sky-500/20"
            >
              <RefreshCw className="w-3 h-3 text-sky-400" /> Advanced Substitute
            </button>
            <button 
              onClick={() => {
                setShowAnalytics(!showAnalytics);
                if (!showAnalytics && !deepAnalysis) handleDeepAnalysis();
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest border",
                showAnalytics 
                  ? "bg-amber-500/20 text-amber-500 border-amber-500/20"
                  : "bg-white/10 hover:bg-white/20 text-white border-white/5"
              )}
            >
              <BarChart3 className="w-3 h-3" /> Visual Intel
            </button>
            <button 
              onClick={() => setShowScouting(!showScouting)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest border shadow-lg shadow-sky-500/20",
                showScouting 
                  ? "bg-sky-500 text-white border-sky-500"
                  : "bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/20"
              )}
            >
              <Target className="w-3 h-3" /> AI Scouting
            </button>
            <button 
              onClick={() => handleBulkAction('anonymize')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black transition-all uppercase tracking-widest border border-white/5"
            >
              <ShieldOff className="w-3 h-3 text-amber-400" /> Anonymize Links
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg text-[9px] font-black transition-all uppercase tracking-widest border border-rose-500/20"
            >
              <Trash2 className="w-3 h-3" /> Purge Records
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Advanced Scouting Panel */}
        <AnimatePresence>
          {showScouting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-8 py-8 overflow-hidden border-b border-black/5"
            >
              <div className="p-8 rounded-3xl bg-sky-500/5 border border-sky-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none">
                  <Fingerprint className="w-32 h-32 text-sky-500" />
                </div>
                
                <div className="relative z-10 max-w-4xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-sky-500 rounded-xl shadow-lg shadow-sky-500/20">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">AI Lead Scout</h3>
                      <p className="text-xs text-slate-500 font-medium">Describe your ideal customer persona (e.g., "Marketing Directors at SaaS companies"), and UItrasnipps will scout the extraction list.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={scoutingPersona}
                        onChange={(e) => setScoutingPersona(e.target.value)}
                        placeholder="e.g., Founders of tech startups in New York..."
                        className="w-full pl-12 pr-4 py-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sky-500/50 outline-none text-sm text-slate-900 transition-all font-medium shadow-sm"
                      />
                    </div>
                    <button 
                      onClick={handleScout}
                      disabled={isScouting || !scoutingPersona.trim()}
                      className="px-8 bg-sky-500 text-white rounded-2xl font-bold text-sm hover:bg-sky-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
                    >
                      {isScouting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Start Scouting
                    </button>
                  </div>

                  {scoutingResult && (
                    <div className="mt-8 p-6 rounded-2xl bg-white/60 border border-sky-500/10 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{scoutingResult}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-8 py-8 overflow-hidden border-b border-black/5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-white/60 border border-black/5 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-sky-500" />
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight">Top Domains</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-black/5 px-2 py-1 rounded-md">Market Share</span>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.domains} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/60 border border-black/5 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <PieChartIcon className="w-5 h-5 text-amber-500" />
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight">Region Distribution</h4>
                    </div>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.regions}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.regions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-8 opacity-10">
                    <Sparkles className="w-24 h-24 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-bold text-white tracking-tight">Deep Intelligence Report</h4>
                      </div>
                      <button 
                        onClick={handleDeepAnalysis}
                        disabled={isAnalyzing}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2"
                      >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Refresh Analysis
                      </button>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none max-h-[300px] overflow-y-auto custom-scrollbar-white pr-4">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
                          <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Processing data streams...</p>
                        </div>
                      ) : (
                        <ReactMarkdown>{deepAnalysis || "Click refresh to generate initial intelligence analysis..."}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Advanced Scouting Panel */}
        <AnimatePresence>
          {showScouting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-8 py-8 overflow-hidden border-b border-black/5"
            >
              <div className="p-8 rounded-3xl bg-sky-500/5 border border-sky-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none">
                  <Fingerprint className="w-32 h-32 text-sky-500" />
                </div>
                
                <div className="relative z-10 max-w-4xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-sky-500 rounded-xl shadow-lg shadow-sky-500/20">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">AI Lead Scout</h3>
                      <p className="text-xs text-slate-500 font-medium">Describe your ideal customer persona (e.g., "Marketing Directors at SaaS companies"), and UItrasnipps will scout the extraction list.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        value={scoutingPersona}
                        onChange={(e) => setScoutingPersona(e.target.value)}
                        placeholder="e.g., Founders of tech startups in New York..."
                        className="w-full pl-12 pr-4 py-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sky-500/50 outline-none text-sm text-slate-900 transition-all font-medium shadow-sm"
                      />
                    </div>
                    <button 
                      onClick={handleScout}
                      disabled={isScouting || !scoutingPersona.trim()}
                      className="px-8 bg-sky-500 text-white rounded-2xl font-bold text-sm hover:bg-sky-600 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
                    >
                      {isScouting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Start Scouting
                    </button>
                  </div>

                  {scoutingResult && (
                    <div className="mt-8 p-6 rounded-2xl bg-white/60 border border-sky-500/10 max-h-[300px] overflow-y-auto custom-scrollbar">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{scoutingResult}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-8 py-8 overflow-hidden border-b border-black/5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-white/60 border border-black/5 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-sky-500" />
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight">Top Domains</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-black/5 px-2 py-1 rounded-md">Market Share</span>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.domains} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-white/60 border border-black/5 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <PieChartIcon className="w-5 h-5 text-amber-500" />
                      <h4 className="font-bold text-slate-900 text-sm tracking-tight">Region Distribution</h4>
                    </div>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.regions}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.regions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-2 p-8 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                  <div className="absolute right-0 top-0 p-8 opacity-10">
                    <Sparkles className="w-24 h-24 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-bold text-white tracking-tight">Deep Intelligence Report</h4>
                      </div>
                      <button 
                        onClick={handleDeepAnalysis}
                        disabled={isAnalyzing}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2"
                      >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Refresh Analysis
                      </button>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none max-h-[300px] overflow-y-auto custom-scrollbar-white pr-4">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <Loader2 className="w-10 h-10 animate-spin text-sky-400" />
                          <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Processing data streams...</p>
                        </div>
                      ) : (
                        <ReactMarkdown>{deepAnalysis || "Click refresh to generate initial intelligence analysis..."}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Structured Table View */}
      <div className="overflow-x-auto selection:bg-amber-500/30">
        {Object.entries(groupedData).map(([group, groupItems]) => (
          <div key={group} className="border-b border-black/5 last:border-0">
            {groupBy && (
              <div className="px-8 py-3 bg-black/[0.04] flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 rounded-sm bg-amber-500/40" />
                  Cluster Segment: <span className="text-slate-900 ml-1">{group}</span>
                </span>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{groupItems.length} nodes Found</span>
              </div>
            )}
            <table className="w-full text-left border-collapse">
              {!groupBy && (
                <thead>
                  <tr className="bg-black/[0.02] border-b border-black/5">
                    <th className="px-8 py-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    {columns.map(col => (
                      <th 
                        key={String(col.key)} 
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={cn(
                          "px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest",
                          col.sortable && "cursor-pointer hover:text-slate-600 transition-colors group/header"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {col.header}
                          {col.sortable && (
                            <ArrowUpDown className={cn(
                              "w-3 h-3 transition-colors", 
                              sortKey === col.key ? "text-amber-500" : "text-slate-200 group-hover/header:text-slate-300"
                            )} />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-8 py-4 text-right w-16" />
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-black/5">
                {groupItems.map((item, idx) => {
                  const id = item.id || Object.values(item)[0];
                  const isAnonymized = anonymizedIds.has(id);
                  return (
                    <tr key={idx} className={cn(
                      "hover:bg-white transition-all group/row",
                      selectedIds.has(id) ? "bg-amber-500/5" : "bg-transparent"
                    )}>
                       <td className="px-8 py-5 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(id)}
                          onChange={() => handleToggleSelect(id)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      {columns.map(col => (
                        <td key={String(col.key)} className="px-8 py-5">
                          {isAnonymized ? (
                            <span className="px-2 py-1 bg-slate-100 text-slate-300 rounded text-[10px] font-mono select-none">
                              SECRET_IDENTIFIER_HIDDEN
                            </span>
                          ) : col.render ? col.render(item) : (
                            <div className="text-sm font-bold text-slate-900 leading-none">
                              {String(item[col.key])}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 text-slate-200 hover:text-slate-900 opacity-0 group-hover/row:opacity-100 transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {filteredData.length === 0 && (
          <div className="p-24 text-center flex flex-col items-center justify-center bg-white/20">
            <div className="w-20 h-20 bg-white shadow-xl rounded-[2rem] flex items-center justify-center mb-6 border border-black/5 animate-pulse">
              <Search className="w-8 h-8 text-slate-100" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">Cluster Output Offline</h4>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">No intelligence detected in this configuration. Try clearing filters or indexing a new source.</p>
          </div>
        )}
      </div>

      {/* Advanced Substitute Modal Overlay */}
      {substitutionModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500 rounded-xl">
                  <RefreshCw className="w-4 h-4 text-white" />
                </div>
                <h4 className="font-bold text-slate-900">Advanced Substitute</h4>
              </div>
              <button 
                onClick={() => setSubstitutionModal(prev => ({ ...prev, isOpen: false }))}
                className="p-2 text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Field</label>
                <select 
                  className="w-full px-4 py-3 bg-black/5 border border-black/5 rounded-xl text-sm outline-none"
                  value={substitutionModal.targetColumn as string}
                  onChange={(e) => setSubstitutionModal(prev => ({ ...prev, targetColumn: e.target.value as any }))}
                >
                  <option value="all">Global (All Columns)</option>
                  {columns.map(c => (
                    <option key={String(c.key)} value={String(c.key)}>{c.header}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Find Expression</label>
                <input 
                  type="text"
                  placeholder="Text to find..."
                  className="w-full px-4 py-3 bg-black/5 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                  value={substitutionModal.search}
                  onChange={(e) => setSubstitutionModal(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Replacement Value</label>
                <input 
                  type="text"
                  placeholder="New value..."
                  className="w-full px-4 py-3 bg-black/5 border border-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                  value={substitutionModal.replace}
                  onChange={(e) => setSubstitutionModal(prev => ({ ...prev, replace: e.target.value }))}
                />
              </div>
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                <p className="text-[10px] text-slate-500 leading-tight">
                  {selectedIds.size > 0 
                    ? `Action will apply only to the ${selectedIds.size} selected nodes.`
                    : "Action will apply to all nodes in the current view."}
                </p>
              </div>
            </div>
            <div className="p-8 bg-black/[0.02] flex items-center gap-4">
              <button 
                onClick={() => setSubstitutionModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Abort
              </button>
              <button 
                onClick={handleBatchSubstitute}
                disabled={!substitutionModal.search}
                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 disabled:opacity-50"
              >
                Execute Substitution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance / Log Footer */}
      <div className="p-10 bg-slate-900/5 border-t border-black/5 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                Compliance Protocol: GDRE/NDPR Standard
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                Anonymization & Local Purge enabled for session {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 bg-white/60 px-3 py-1.5 rounded-lg border border-black/5">
            PLATFORM_ID: USNIPPS_CORTEX_{userTier.toUpperCase()}
          </div>
        </div>

        {sessionLogs.length > 0 && (
          <div className="space-y-1 bg-black/5 p-4 rounded-xl border border-black/5">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Briefcase className="w-3 h-3" /> Intelligence Logs
            </div>
            {sessionLogs.map((log, i) => (
              <div key={i} className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
