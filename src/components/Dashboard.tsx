import React, { useState, useEffect } from 'react';
import { Mail, Send, Eye, MousePointer2, TrendingUp, TrendingDown, Bot, Activity, ShieldCheck, Zap, Crown, Target, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
  onUpgradeClick: () => void;
  onNewCampaign: () => void;
  onViewAnalytics: () => void;
}

export function Dashboard({ userTier, onUpgradeClick, onNewCampaign, onViewAnalytics }: DashboardProps) {
  const [harvestCount, setHarvestCount] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem('ultrasnipps_last_emails');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setHarvestCount(parsed.length || 0);
      } catch (e) {}
    }
  }, []);

  const tierLabels = {
    page: 'Page',
    knight: 'Knight',
    duke: 'Duke / Duchess',
    monarch: 'Monarch',
    emperor: 'Emperor'
  };

  const stats = [
    { label: 'Total Sent', value: '12,450', change: '+12%', trend: 'up', icon: Send, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Email Harvest', value: harvestCount.toLocaleString(), change: '+Active', trend: 'up', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Open Rate', value: '24.8%', change: '+2.4%', trend: 'up', icon: Eye, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Subscribers', value: '8,920', change: '+156', trend: 'up', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  const recentCampaigns = [
    { id: 1, name: 'Product Launch Q1', date: '2 days ago', recipients: '4,500', openRate: '22.4%', status: 'Completed' },
    { id: 2, name: 'Newsletter Weekly', date: '5 days ago', recipients: '8,200', openRate: '18.9%', status: 'Completed' },
    { id: 3, name: 'Re-engagement Flow', date: '1 week ago', recipients: '1,200', openRate: '31.2%', status: 'Completed' },
  ];

  return (
    <div className="space-y-12">
      {userTier !== 'emperor' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[2rem] bg-gradient-to-r from-amber-500 to-sky-500 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/20 border border-white/20"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">You are currently in {tierLabels[userTier]} Mode</h3>
              <p className="text-white/80 text-sm font-medium">Ascend to Emperor to unlock the full power of Ultrasnipps Intelligence.</p>
            </div>
          </div>
          <button 
            onClick={onUpgradeClick}
            className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all shadow-lg"
          >
            Ascend to Emperor
          </button>
        </motion.div>
      )}

      <div className="glass-panel rounded-[2.5rem] p-12 relative overflow-hidden group">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold uppercase tracking-[0.2em] mb-6 border border-amber-500/20">
            {userTier === 'emperor' || userTier === 'monarch' ? <Crown className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
            {tierLabels[userTier]} Command Center
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-8 leading-[1.1] tracking-tight text-glow text-slate-900">
            Elevate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-sky-500">outreach</span> with precision.
          </h2>
          <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-10 font-medium">
            Your smart email marketing command center is now more powerful than ever. 
            Enjoy our new **Undo** safety net, **Campaign Scheduling**, and **Advanced Tagging** to reach your audience with precision.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={onNewCampaign}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-[13px] transition-all shadow-lg shadow-amber-500/20"
            >
              Launch New Campaign
            </button>
            <button 
              onClick={onViewAnalytics}
              className="px-8 py-4 bg-white/60 hover:bg-white text-slate-900 rounded-2xl font-bold text-[13px] transition-all border border-black/5"
            >
              View Analytics
            </button>
          </div>
        </div>
        <div className="absolute right-[-10%] top-[-20%] w-[60%] h-[140%] bg-gradient-to-br from-amber-500/10 to-sky-500/10 blur-[120px] rounded-full group-hover:opacity-100 opacity-50 transition-opacity duration-1000" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-8 rounded-3xl group">
            <div className="flex items-center justify-between mb-6">
              <div className={`${stat.bg} p-4 rounded-2xl border border-black/5`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border",
                stat.trend === 'up' 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              )}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">{stat.value}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-[0.25em]">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-10 rounded-[2rem] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-500/20">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Deliverability Health</h3>
                  <p className="text-sm text-slate-500">Real-time monitoring of your sender reputation.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
                Optimal
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'SPF Record', status: 'Verified', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                { label: 'DKIM Signature', status: 'Active', color: 'text-sky-600', bg: 'bg-sky-500/10' },
                { label: 'DMARC Policy', status: 'Strict', color: 'text-amber-600', bg: 'bg-amber-500/10' },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/60 border border-black/10 group-hover:border-black/20 transition-all">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{item.label}</p>
                  <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest", item.bg, item.color)}>
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", item.color.replace('text', 'bg'))} />
                    {item.status}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <div className="flex items-center gap-4 mb-4">
                <Zap className="w-5 h-5 text-sky-500" />
                <h4 className="font-bold text-slate-900 text-sm">Inbox Optimization Tip</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your current **DMARC policy** is set to "Strict". This ensures maximum protection against spoofing and significantly boosts your sender score with Gmail and Outlook.
              </p>
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2rem]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/60 rounded-2xl border border-black/10">
                  <TrendingUp className="w-6 h-6 text-slate-500" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Recent Campaigns</h3>
              </div>
              <button className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-widest">View All</button>
            </div>
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign.id} className="group p-6 rounded-2xl bg-white/40 border border-black/5 hover:border-black/10 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{campaign.name}</h4>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{campaign.date}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Recipients</span>
                      <span className="text-base md:text-lg font-bold text-slate-900">{campaign.recipients}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Open Rate</span>
                      <span className="text-base md:text-lg font-bold text-emerald-600">{campaign.openRate}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</span>
                      <span className="text-sm font-bold text-sky-600">{campaign.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-[2rem] space-y-8">
          <div className="p-10 rounded-[2rem] space-y-8 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Certified</h3>
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest">Active Assurance</p>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              {[
                { label: 'SMTP Integrity', status: 'Verified' },
                { label: 'SMS Gateway', status: 'Secure' },
                { label: 'Data Encryption', status: 'AES-256' },
                { label: 'Compliance', status: 'GDPR/TCPA' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-emerald-500/10">
                  <span className="text-xs font-bold text-slate-600">{item.label}</span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.status}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed italic relative z-10">
              Your mailing infrastructure is fully certified for high-volume royal outreach.
            </p>
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Smart Insights</h3>
          <div className="space-y-6">
            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <Bot className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Subject Line Tip</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed relative z-10">
                Your last campaign had a lower open rate. Try using more action-oriented verbs in your subject lines to increase engagement by up to 15%.
              </p>
              <div className="absolute right-[-20%] bottom-[-20%] w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
            </div>
            <div className="p-6 bg-sky-500/10 border border-sky-500/20 rounded-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <Bot className="w-5 h-5 text-sky-600" />
                <span className="text-xs font-bold text-sky-700 uppercase tracking-widest">Audience Segment</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed relative z-10">
                We've identified a segment of 450 users who haven't opened an email in 30 days. Consider a re-engagement campaign with a special offer.
              </p>
              <div className="absolute right-[-20%] bottom-[-20%] w-32 h-32 bg-sky-500/10 blur-3xl rounded-full" />
            </div>
          </div>
          <button className="w-full py-4 bg-white/60 hover:bg-white text-slate-900 rounded-2xl text-sm font-bold transition-all border border-black/5 uppercase tracking-widest">
            Generate More Insights
          </button>
        </div>
      </div>
    </div>
  );
}
