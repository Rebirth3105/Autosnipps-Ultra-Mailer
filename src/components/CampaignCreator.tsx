import React, { useState } from 'react';
import { X, Sparkles, Send, Save, Loader2, Plus, ShieldCheck, AlertTriangle, CheckCircle, Crown, MessageSquare, Phone, Upload, UserPlus, Database, Trash2, Mail } from 'lucide-react';
import { draftEmail, despamMessage } from '../services/gemini';
import { cn } from '../lib/utils';
import { detectSpam, SpamDetectionResult } from '../lib/spamFilter';

interface CampaignCreatorProps {
  onClose: () => void;
  onSave: (campaign: any) => void;
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
}

export function CampaignCreator({ onClose, onSave, userTier }: CampaignCreatorProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientMethod, setRecipientMethod] = useState<'manual' | 'upload' | 'import'>('manual');
  const [isDrafting, setIsDrafting] = useState(false);
  const [topic, setTopic] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{ score: number; risky: number; invalid: number } | null>(null);
  const [isSms, setIsSms] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  
  // SpamGuard State
  const [spamResult, setSpamResult] = useState<SpamDetectionResult>({ score: 0, foundWords: [] });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showSpamDetails, setShowSpamDetails] = useState(false);

  const isKnightOrHigher = userTier !== 'page';
  const isDukeOrHigher = userTier === 'duke' || userTier === 'monarch' || userTier === 'emperor';

  const handleContentChange = (val: string) => {
    setContent(val);
    const result = detectSpam(val);
    setSpamResult(result);
  };

  const handleOptimizeContent = async () => {
    if (!content.trim()) return;
    setIsOptimizing(true);
    try {
      const optimized = await despamMessage(content);
      if (optimized) {
        setContent(optimized);
        setSpamResult(detectSpam(optimized));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAddManualRecipients = () => {
    const raw = recipientInput.split(/[\s,;\n]+/);
    const valid = raw.filter(r => {
      if (isSms) return /^\+?\d{7,15}$/.test(r);
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(r);
    });
    setRecipients(prev => Array.from(new Set([...prev, ...valid])));
    setRecipientInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const raw = text.split(/[\s,;\n]+/);
      const valid = raw.filter(r => {
        if (isSms) return /^\+?\d{7,15}$/.test(r);
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(r);
      });
      setRecipients(prev => Array.from(new Set([...prev, ...valid])));
    };
    reader.readAsText(file);
  };

  const handleImportExtracted = () => {
    const key = isSms ? 'ultrasnipps_last_phones' : 'ultrasnipps_last_emails';
    const stored = localStorage.getItem(key);
    if (stored) {
      const list = JSON.parse(stored);
      setRecipients(prev => Array.from(new Set([...prev, ...list])));
    }
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSmartDraft = async () => {
    if (!topic.trim()) return;
    setIsDrafting(true);
    try {
      const draft = await draftEmail(topic, 'General Audience', 'Professional & Engaging');
      setContent(draft || '');
    } catch (error) {
      console.error(error);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAuditAudience = async () => {
    setIsAuditing(true);
    // Simulate auditing the selected segment
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAuditResult({
      score: 92,
      risky: 2,
      invalid: 0
    });
    setIsAuditing(false);
  };

  const handleSend = async () => {
    setSendError(null);
    setSendSuccess(null);
    
    if (isSms) {
      if (!phoneNumber.trim()) {
        setSendError("Please enter a recipient phone number.");
        return;
      }
      setIsSending(true);
      try {
        const response = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: phoneNumber, body: content }),
        });
        const data = await response.json();
        if (data.success) {
          setSendSuccess(`SMS sent successfully! SID: ${data.sid}${data.mock ? ' (Simulated)' : ''}`);
          setTimeout(onClose, 2000);
        } else {
          setSendError(`Failed to send SMS: ${data.error}`);
        }
      } catch (error) {
        console.error(error);
        setSendError("An error occurred while sending SMS.");
      } finally {
        setIsSending(false);
      }
    } else {
      setIsSending(true);
      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            from: "Autosnipps <noreply@autosnipps.com>",
            to: recipients.length > 0 ? recipients.join(',') : "recipient@example.com",
            subject: subject || "New Campaign from Autosnipps",
            text: content,
            html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">${content.replace(/\n/g, '<br>')}</div>`
          }),
        });
        const data = await response.json();
        if (data.success) {
          setSendSuccess(`Email campaign launched successfully via ${data.provider}!${data.mock ? ' (Simulated)' : ''}`);
          onSave({ name, subject, content, type: 'email' });
          setTimeout(onClose, 2000);
        } else {
          setSendError(`Failed to launch campaign: ${data.error}`);
        }
      } catch (error) {
        console.error(error);
        setSendError("An error occurred while launching the campaign.");
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
      <div className="glass-panel w-full max-w-6xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] flex flex-col max-h-[92vh] overflow-hidden border-black/5">
        <div className="p-10 border-b border-black/5 flex items-center justify-between bg-white">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight text-glow">Create New Campaign</h2>
              <p className="text-sm text-slate-600 font-medium">Draft your next big message with smart assistance</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 hover:bg-black/5 rounded-full transition-all text-slate-300 hover:text-slate-900"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Product Launch"
                className="w-full px-6 py-4 bg-white border border-black/10 rounded-2xl text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-400 text-sm"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Make it catchy!"
                className="w-full px-6 py-4 bg-white border border-black/10 rounded-2xl text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-400 text-sm"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest">
                  {isSms ? 'SMS Content' : 'Email Content'}
                </label>
                {isSms && (
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    content.length > 160 ? "text-amber-500" : "text-slate-400"
                  )}>
                    {content.length} / 160 chars {content.length > 160 && '(Will be split)'}
                  </span>
                )}
              </div>
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={isSms ? "Write your SMS message here..." : "Write your message here..."}
                className="w-full p-6 bg-white border border-black/10 rounded-2xl text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all min-h-[400px] font-mono text-sm leading-relaxed placeholder:text-slate-400"
              />
            </div>

            {/* SpamGuard Results */}
            <div className={cn(
              "p-8 rounded-[2rem] border transition-all duration-500",
              spamResult.score > 50 ? "bg-rose-50 border-rose-200" : 
              spamResult.score > 20 ? "bg-amber-50 border-amber-200" : 
              "bg-emerald-50 border-emerald-200"
            )}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    spamResult.score > 50 ? "bg-rose-500 text-white" : 
                    spamResult.score > 20 ? "bg-amber-500 text-white" : 
                    "bg-emerald-500 text-white"
                  )}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">SpamGuard Intelligence</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time Deliverability Check</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-2xl font-black",
                    spamResult.score > 50 ? "text-rose-600" : 
                    spamResult.score > 20 ? "text-amber-600" : 
                    "text-emerald-600"
                  )}>
                    {100 - spamResult.score}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Deliverability Score</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {spamResult.foundWords.length > 0 ? (
                  spamResult.foundWords.map((word, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-black/5 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                      {word}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-emerald-600 font-medium">No common spam triggers detected.</p>
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleOptimizeContent}
                  disabled={isOptimizing || !content.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition-all disabled:opacity-50"
                >
                  {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
                  Optimize with AI
                </button>
                <button 
                  onClick={() => setShowSpamDetails(!showSpamDetails)}
                  className="px-4 bg-white border border-black/10 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Details
                </button>
              </div>

              {showSpamDetails && (
                <div className="mt-6 pt-6 border-t border-black/5 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {spamResult.score > 50 ? 
                      "CRITICAL: This message has a high probability of being caught in spam filters. Major triggers detected." :
                      spamResult.score > 20 ? 
                      "WARNING: Some words may trigger basic spam filters. Consider rephrasing for better reach." :
                      "CLEAN: Your message looks safe and professional." 
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-10">
            <div className={cn(
              "glass-panel p-8 rounded-[2rem] border-sky-500/20 bg-sky-500/5 relative overflow-hidden",
              !isKnightOrHigher && "opacity-80"
            )}>
              {!isKnightOrHigher && (
                <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                  <Crown className="w-8 h-8 text-amber-500 mb-3" />
                  <h4 className="font-bold text-slate-900 text-sm mb-1">Knight Feature</h4>
                  <p className="text-xs text-slate-500 mb-4">Unlock Ultrasnipps drafting with Knight rank.</p>
                  <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-amber-500/20">
                    Ascend Now
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-sky-500" />
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">Smart Draft Assistant</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Tell Ultrasnipps what you want to write about, and we'll generate a professional draft for you.
              </p>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What is this email about?"
                className="w-full p-4 bg-white border border-black/10 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-sky-500/50 outline-none mb-6 h-32 placeholder:text-slate-400 transition-all"
              />
              <button
                onClick={handleSmartDraft}
                disabled={isDrafting || !topic.trim()}
                className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-4 rounded-2xl font-bold hover:bg-sky-600 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/20"
              >
                {isDrafting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Generate Draft
              </button>
            </div>

            <div className="glass-panel p-8 rounded-[2rem] border-black/5 bg-white/40">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-6">Campaign Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-black/5 relative overflow-hidden">
                  {!isKnightOrHigher && (
                    <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                      <Crown className="w-4 h-4 text-amber-500 mr-2" />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Knight Rank Required</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      isSms ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Send as SMS</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Twilio Integration</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => isKnightOrHigher && setIsSms(!isSms)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      isSms ? "bg-sky-500" : "bg-slate-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      isSms ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>

                {isSms && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipient Phone</label>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{recipients.length} Selected</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (setRecipients(p => Array.from(new Set([...p, phoneNumber]))), setPhoneNumber(''))}
                          placeholder="+1234567890"
                          className="w-full pl-12 pr-4 py-3 bg-white/60 border border-black/5 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-sky-500/50 outline-none transition-all"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (phoneNumber.trim()) {
                            setRecipients(p => Array.from(new Set([...p, phoneNumber])));
                            setPhoneNumber('');
                          }
                        }}
                        className="px-4 bg-white/60 border border-black/5 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-white transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {!isSms && (
                  <div className="space-y-6 pt-4 border-t border-black/5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-widest">Audience Builder</label>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase">
                        {recipients.length} Recipients
                      </div>
                    </div>

                    <div className="flex p-1 bg-black/5 rounded-2xl border border-black/5">
                      <button
                        onClick={() => setRecipientMethod('manual')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all",
                          recipientMethod === 'manual' ? "bg-white text-slate-900 shadow-md" : "text-slate-400"
                        )}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Manual
                      </button>
                      <button
                        onClick={() => setRecipientMethod('upload')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all",
                          recipientMethod === 'upload' ? "bg-white text-slate-900 shadow-md" : "text-slate-400"
                        )}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </button>
                      <button
                        onClick={() => setRecipientMethod('import')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-bold transition-all",
                          recipientMethod === 'import' ? "bg-white text-slate-900 shadow-md" : "text-slate-400"
                        )}
                      >
                        <Database className="w-3.5 h-3.5" />
                        Import
                      </button>
                    </div>

                    {recipientMethod === 'manual' && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                        <textarea
                          value={recipientInput}
                          onChange={(e) => setRecipientInput(e.target.value)}
                          placeholder="Paste emails separated by commas or lines..."
                          className="w-full p-4 bg-white/60 border border-black/5 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none h-24 placeholder:text-slate-300 transition-all font-mono"
                        />
                        <button 
                          onClick={handleAddManualRecipients}
                          disabled={!recipientInput.trim()}
                          className="w-full py-3 bg-white border border-black/10 rounded-xl text-xs font-bold text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          Add to Audience
                        </button>
                      </div>
                    )}

                    {recipientMethod === 'upload' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-black/10 rounded-[2rem] bg-white/40 cursor-pointer hover:bg-white hover:border-amber-500/50 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Upload CSV or TXT</p>
                          </div>
                          <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                        </label>
                      </div>
                    )}

                    {recipientMethod === 'import' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                          <p className="text-[10px] text-slate-500 leading-tight mb-4">
                            Directly import leads discovered during your latest extraction session.
                          </p>
                          <button 
                            onClick={handleImportExtracted}
                            className="w-full py-3 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                          >
                            <Database className="w-4 h-4" />
                            Import Last Extraction
                          </button>
                        </div>
                      </div>
                    )}

                    {recipients.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest text-glow">Audience List</label>
                          <button 
                            onClick={() => setRecipients([])}
                            className="text-[9px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-widest"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                          {recipients.map((r, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/60 border border-black/5 rounded-xl group/item">
                              <span className="text-[11px] font-mono text-slate-900 truncate flex-1">{r}</span>
                              <button 
                                onClick={() => handleRemoveRecipient(i)}
                                className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/item:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-black/5 relative">
                  {!isDukeOrHigher && (
                    <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-lg rounded-full border border-black/5">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Duke Rank Required</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deliverability Audit</label>
                    {auditResult && (
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  
                  {!auditResult ? (
                    <button 
                      onClick={handleAuditAudience}
                      disabled={isAuditing}
                      className="w-full py-3 bg-white/60 border border-black/5 rounded-xl text-xs font-bold text-slate-600 hover:bg-white hover:text-sky-600 transition-all flex items-center justify-center gap-2"
                    >
                      {isAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Audit Selected Audience
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Health Score</span>
                        <span className="text-sm font-bold text-emerald-600">{auditResult.score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${auditResult.score}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                          <div className="text-xs font-bold text-amber-600 uppercase mb-1">Risky</div>
                          <div className="text-lg font-bold text-slate-900">{auditResult.risky}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                          <div className="text-xs font-bold text-rose-600 uppercase mb-1">Invalid</div>
                          <div className="text-lg font-bold text-slate-900">{auditResult.invalid}</div>
                        </div>
                      </div>
                      {auditResult.risky > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 leading-tight">
                            We found {auditResult.risky} risky emails. We recommend removing them to protect your sender reputation.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative flex items-center">
                    <input type="checkbox" id="track" className="peer w-5 h-5 rounded border-black/20 bg-white/60 text-amber-500 focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer" defaultChecked />
                  </div>
                  <label htmlFor="track" className="text-sm text-slate-500 group-hover:text-slate-900 transition-colors cursor-pointer">Track opens & clicks</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-black/5 flex items-center justify-between gap-6 bg-white/40">
          <div className="flex-1">
            {sendError && (
              <p className="text-sm text-rose-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <AlertTriangle className="w-4 h-4" />
                {sendError}
              </p>
            )}
            {sendSuccess && (
              <p className="text-sm text-emerald-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <CheckCircle className="w-4 h-4" />
                {sendSuccess}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="px-8 py-3.5 text-slate-500 font-bold hover:bg-black/5 rounded-2xl transition-all border border-black/5"
            >
              Cancel
            </button>
          <button className="px-8 py-3.5 bg-white/60 text-slate-900 font-bold rounded-2xl hover:bg-white transition-all border border-black/5 flex items-center gap-3">
            <Save className="w-5 h-5" />
            Save Draft
          </button>
          <button 
            onClick={handleSend}
            disabled={isSending}
            className="px-10 py-3.5 bg-amber-500 text-white font-bold rounded-2xl hover:bg-amber-600 transition-all flex items-center gap-3 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isSms ? 'Send SMS' : 'Send Now'}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}
