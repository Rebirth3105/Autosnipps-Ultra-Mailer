import React from 'react';
import { LayoutDashboard, Mail, Users, Settings, BarChart3, Plus, Target, Search, ShieldCheck, Phone, Video, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
  onUpgradeClick: () => void;
}

export function Sidebar({ activeTab, setActiveTab, userTier, onUpgradeClick }: SidebarProps) {
  const tierConfig = {
    page: { label: 'Page', color: 'bg-slate-200 text-slate-500' },
    knight: { label: 'Knight', color: 'bg-sky-500 text-white' },
    duke: { label: 'Duke', color: 'bg-indigo-500 text-white' },
    monarch: { label: 'Monarch', color: 'bg-amber-500 text-white' },
    emperor: { label: 'Emperor', color: 'bg-rose-500 text-white' },
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'campaigns', icon: Mail, label: 'Campaigns' },
    { id: 'recipients', icon: Users, label: 'Recipients' },
    { id: 'deliverability', icon: ShieldCheck, label: 'Deliverability' },
    { id: 'leadgen', icon: Target, label: 'Lead Gen' },
    { id: 'extractor', icon: Search, label: 'Email Extractor' },
    { id: 'mobile-extractor', icon: Phone, label: 'Mobile Extractor' },
    { id: 'task-extractor', icon: FileText, label: 'Task Extractor' },
    { id: 'video-studio', icon: Video, label: 'Video Studio' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-72 bg-white/40 backdrop-blur-2xl border-r border-black/5 flex flex-col shrink-0 z-20">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-glow text-slate-900">Autosnipps</span>
            <span className={cn(
              "text-[11px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-md w-fit",
              tierConfig[userTier].color
            )}>
              {tierConfig[userTier].label}
            </span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group",
                activeTab === item.id
                  ? "bg-white text-slate-900 shadow-lg shadow-black/5 border border-black/5"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                activeTab === item.id ? "text-amber-500" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {item.label}
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8">
        {userTier !== 'emperor' ? (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-sky-500/10 border border-amber-500/10">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Ascension Awaits</p>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">Unlock the full power of the digital realm.</p>
            <button 
              onClick={onUpgradeClick}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              Ascend Now
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Emperor Active</p>
              <p className="text-xs text-slate-500">The galaxy is yours</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
