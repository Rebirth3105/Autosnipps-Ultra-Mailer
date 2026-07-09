import React, { useState } from 'react';
import { Mail, Plus, Search, Filter, MoreVertical, Edit2, Trash2, Send, Calendar, Clock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from './Modal';

interface CampaignsViewProps {
  onNew: () => void;
  onDelete: (id: string) => void;
  onSchedule: (id: string, date: string) => void;
}

export function CampaignsView({ onNew, onDelete, onSchedule }: CampaignsViewProps) {
  const [campaigns, setCampaigns] = useState([
    { id: '1', name: 'Welcome Series', subject: 'Welcome to our community!', status: 'sent', recipients: 1250, date: 'Mar 20, 2026' },
    { id: '2', name: 'Spring Sale 2026', subject: 'Up to 50% off everything!', status: 'draft', recipients: 8900, date: 'Mar 22, 2026' },
    { id: '3', name: 'Monthly Newsletter', subject: 'Your March updates are here', status: 'scheduled', recipients: 4500, date: 'Apr 01, 2026' },
  ]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const handleSchedule = () => {
    if (scheduleId && scheduleDate && scheduleTime) {
      onSchedule(scheduleId, `${scheduleDate} ${scheduleTime}`);
      setScheduleId(null);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight text-glow">Campaigns</h2>
          <p className="text-slate-500 text-sm mt-1">Track and manage your outreach performance.</p>
        </div>
        <button 
          onClick={onNew}
          className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      <div className="glass-panel rounded-[2rem] overflow-hidden border-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/40 border-b border-black/5">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Campaign Name</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Recipients</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-white/40 transition-all group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-900 text-base tracking-tight">{c.name}</div>
                    <div className="text-xs text-slate-400 truncate max-w-xs font-mono mt-0.5">{c.subject}</div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest inline-flex items-center gap-1.5",
                      c.status === 'sent' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                      c.status === 'draft' ? "bg-black/5 text-slate-400 border border-black/10" :
                      "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", 
                        c.status === 'sent' ? "bg-emerald-500" : 
                        c.status === 'draft' ? "bg-slate-300" : 
                        "bg-sky-500"
                      )} />
                      {c.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-600 font-bold">{c.recipients.toLocaleString()}</td>
                  <td className="px-8 py-6 text-sm text-slate-400 font-mono">{c.date}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => setScheduleId(c.id)}
                        className="p-2 text-slate-300 hover:text-slate-900 hover:bg-black/5 rounded-xl transition-all"
                        title="Schedule"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-300 hover:text-slate-900 hover:bg-black/5 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(c.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Campaign"
        footer={
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => setDeleteId(null)}
              className="flex-1 py-3 text-slate-500 font-bold hover:bg-black/5 rounded-2xl transition-all border border-black/5"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
            >
              Delete Permanently
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-6 p-2">
          <div className="p-4 bg-rose-500/10 rounded-[1.5rem] shrink-0 border border-rose-500/20">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <p className="text-slate-900 font-bold text-lg md:text-xl mb-2 tracking-tight">Are you sure?</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              This action cannot be undone. All data associated with this campaign will be permanently removed from our servers.
            </p>
          </div>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={!!scheduleId}
        onClose={() => setScheduleId(null)}
        title="Schedule Campaign"
        footer={
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => setScheduleId(null)}
              className="flex-1 py-3 text-slate-500 font-bold hover:bg-black/5 rounded-2xl transition-all border border-black/5"
            >
              Cancel
            </button>
            <button 
              onClick={handleSchedule}
              disabled={!scheduleDate || !scheduleTime}
              className="flex-1 py-3 bg-sky-500 text-white font-bold rounded-2xl hover:bg-sky-600 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/20"
            >
              Schedule
            </button>
          </div>
        }
      >
        <div className="space-y-8 p-2">
          <p className="text-sm text-slate-500 leading-relaxed">Pick a date and time to automatically send this campaign to your selected recipients.</p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="date" 
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/60 border border-black/5 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Time</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="time" 
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/60 border border-black/5 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
