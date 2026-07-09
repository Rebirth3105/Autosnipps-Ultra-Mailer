import React, { useState, useMemo } from 'react';
import { UserPlus, Mail, Tag, MoreHorizontal, Search, Filter, X, Plus, Trash2, ShieldCheck, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from './Modal';
import { verifyEmail } from '../services/emailVerification';

interface RecipientsViewProps {
  onDelete: (id: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
}

export function RecipientsView({ onDelete, onUpdateTags }: RecipientsViewProps) {
  const [recipients, setRecipients] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', tags: ['customer', 'vip'], verificationStatus: 'unknown', verificationScore: 0 },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'active', tags: ['lead'], verificationStatus: 'unknown', verificationScore: 0 },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com', status: 'unsubscribed', tags: ['old-customer'], verificationStatus: 'unknown', verificationScore: 0 },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', status: 'active', tags: ['customer'], verificationStatus: 'unknown', verificationScore: 0 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<any | null>(null);
  const [newTag, setNewTag] = useState('');
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [isBulkVerifying, setIsBulkVerifying] = useState(false);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    recipients.forEach(r => r.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [recipients]);

  const filteredRecipients = useMemo(() => {
    return recipients.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || r.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [recipients, searchQuery, selectedTag]);

  const handleAddTag = () => {
    if (newTag && editingRecipient && !editingRecipient.tags.includes(newTag)) {
      const updatedTags = [...editingRecipient.tags, newTag];
      onUpdateTags(editingRecipient.id, updatedTags);
      setEditingRecipient({ ...editingRecipient, tags: updatedTags });
      setNewTag('');
    }
  };

  const handleVerify = async (id: string, email: string) => {
    setVerifyingIds(prev => new Set(prev).add(id));
    try {
      const result = await verifyEmail(email);
      if (result.data) {
        setRecipients(prev => prev.map(r => 
          r.id === id ? { ...r, verificationStatus: result.data!.result, verificationScore: result.data!.score } : r
        ));
      }
    } finally {
      setVerifyingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleBulkVerify = async () => {
    setIsBulkVerifying(true);
    const toVerify = filteredRecipients.filter(r => r.verificationStatus === 'unknown');
    
    for (const r of toVerify) {
      await handleVerify(r.id, r.email);
    }
    setIsBulkVerifying(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editingRecipient) {
      const updatedTags = editingRecipient.tags.filter((t: string) => t !== tagToRemove);
      onUpdateTags(editingRecipient.id, updatedTags);
      setEditingRecipient({ ...editingRecipient, tags: updatedTags });
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight text-glow">Recipients</h2>
          <p className="text-slate-400 text-sm mt-1">Manage your audience and segmentation tags.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBulkVerify}
            disabled={isBulkVerifying}
            className="flex items-center gap-2 bg-white/60 border border-black/5 text-slate-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-white/80 transition-all disabled:opacity-50"
          >
            {isBulkVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Verify All
          </button>
          <button className="flex items-center gap-2 bg-white/60 border border-black/5 text-slate-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-white/80 transition-all">
            Import CSV
          </button>
          <button className="flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20">
            <UserPlus className="w-4 h-4" />
            Add Recipient
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] overflow-hidden border-black/5">
        <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipients..."
                className="pl-12 pr-6 py-3 bg-white/60 border border-black/5 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-sky-500/50 outline-none w-80 transition-all placeholder:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-300" />
              <select 
                value={selectedTag || ''} 
                onChange={(e) => setSelectedTag(e.target.value || null)}
                className="bg-transparent text-sm text-slate-500 font-bold outline-none cursor-pointer hover:text-slate-900 transition-colors"
              >
                <option value="" className="bg-white">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag} className="bg-white">{tag}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            <span className="text-slate-900">{filteredRecipients.length}</span> Total Recipients
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/40 border-b border-black/5">
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Name & Email</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Deliverability</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Tags</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredRecipients.map((r) => (
                <tr key={r.id} className="hover:bg-white/60 transition-all group">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-900 text-base tracking-tight">{r.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{r.email}</div>
                  </td>
                  <td className="px-8 py-6">
                    {verifyingIds.has(r.id) ? (
                      <div className="flex items-center gap-2 text-sky-500 text-xs font-bold uppercase tracking-widest">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </div>
                    ) : r.verificationStatus === 'unknown' ? (
                      <button 
                        onClick={() => handleVerify(r.id, r.email)}
                        className="text-xs font-bold text-slate-300 hover:text-sky-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verify Now
                      </button>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest",
                          r.verificationStatus === 'deliverable' ? "text-emerald-600" : 
                          r.verificationStatus === 'risky' ? "text-amber-600" : "text-rose-600"
                        )}>
                          {r.verificationStatus === 'deliverable' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                           r.verificationStatus === 'risky' ? <AlertCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          {r.verificationStatus}
                        </div>
                        <div className="w-24 h-1 bg-black/5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              r.verificationScore > 80 ? "bg-emerald-500" : 
                              r.verificationScore > 50 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${r.verificationScore}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest inline-flex items-center gap-1.5",
                      r.status === 'active' 
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", r.status === 'active' ? "bg-emerald-500" : "bg-rose-500")} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 text-slate-600 rounded-lg text-xs font-bold border border-black/5">
                          <Tag className="w-3 h-3 text-slate-300" />
                          {tag}
                        </span>
                      ))}
                      <button 
                        onClick={() => setEditingRecipient(r)}
                        className="p-1.5 text-slate-300 hover:text-slate-900 hover:bg-black/5 rounded-lg transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleVerify(r.id, r.email)}
                        className="p-2 text-slate-300 hover:text-sky-500 hover:bg-sky-500/10 rounded-xl transition-all"
                        title="Re-verify email"
                      >
                        <RefreshCw className={cn("w-4 h-4", verifyingIds.has(r.id) && "animate-spin")} />
                      </button>
                      <button 
                        onClick={() => setEditingRecipient(r)}
                        className="p-2 text-slate-300 hover:text-slate-900 hover:bg-black/5 rounded-xl transition-all"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(r.id)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
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

      {/* Tag Management Modal */}
      <Modal
        isOpen={!!editingRecipient}
        onClose={() => setEditingRecipient(null)}
        title={`Manage Tags: ${editingRecipient?.name}`}
      >
        <div className="space-y-8 p-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Tags</label>
            <div className="flex flex-wrap gap-2">
              {editingRecipient?.tags.map((tag: string) => (
                <span key={tag} className="flex items-center gap-2 px-4 py-2 bg-white/60 text-slate-700 rounded-xl text-sm font-bold border border-black/5">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="text-slate-300 hover:text-rose-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
              {editingRecipient?.tags.length === 0 && (
                <p className="text-sm text-slate-300 italic">No tags assigned</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-black/5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Add New Tag</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Enter tag name..."
                className="flex-1 px-5 py-3 bg-white/60 border border-black/5 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-sky-500/50 outline-none transition-all placeholder:text-slate-300"
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-6 py-3 bg-sky-500 text-white rounded-2xl font-bold text-sm hover:bg-sky-600 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/20"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
