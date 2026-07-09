import React, { useState } from 'react';
import { Sparkles, Loader2, Target, Users, Gift, Copy, CheckCircle2 } from 'lucide-react';
import { generateLeadMagnet } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export function LeadGen() {
  const [business, setBusiness] = useState('');
  const [audience, setAudience] = useState('');
  const [offerType, setOfferType] = useState('E-book');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!business.trim() || !audience.trim()) return;
    setIsGenerating(true);
    try {
      const content = await generateLeadMagnet(business, audience, offerType);
      setResult(content || '');
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 text-[10px] font-bold uppercase tracking-widest mb-6 border border-sky-500/20">
            <Sparkles className="w-3 h-3" />
            Growth Engine
          </div>
          <h2 className="text-6xl font-bold mb-8 leading-[1.1] tracking-tight text-glow text-slate-900">
            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-amber-500">Lead Magnet</span> Generator.
          </h2>
          <p className="text-slate-500 text-xl leading-relaxed mb-0 font-medium">
            Stop guessing and start growing. Describe your business and audience, and Ultrasnipps will craft a high-converting lead magnet strategy and landing page copy.
          </p>
        </div>
        <Sparkles className="absolute right-10 top-10 w-32 h-32 text-slate-900/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-3xl space-y-8">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                <Target className="w-4 h-4 text-sky-500" />
                Your Business
              </label>
              <textarea
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="e.g., A boutique fitness studio specializing in HIIT"
                className="w-full p-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sky-500/50 outline-none h-32 text-sm text-slate-900 placeholder:text-slate-300 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                <Users className="w-4 h-4 text-sky-500" />
                Target Audience
              </label>
              <textarea
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Busy professionals looking for 30-min workouts"
                className="w-full p-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sky-500/50 outline-none h-32 text-sm text-slate-900 placeholder:text-slate-300 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                <Gift className="w-4 h-4 text-sky-500" />
                Offer Type
              </label>
              <select
                value={offerType}
                onChange={(e) => setOfferType(e.target.value)}
                className="w-full p-4 bg-white/60 border border-black/5 rounded-2xl focus:ring-2 focus:ring-sky-500/50 outline-none text-sm text-slate-900"
              >
                <option className="bg-white">E-book / Guide</option>
                <option className="bg-white">Checklist / Cheat Sheet</option>
                <option className="bg-white">Webinar / Video Training</option>
                <option className="bg-white">Discount Code / Coupon</option>
                <option className="bg-white">Free Consultation</option>
                <option className="bg-white">Template / Resource Kit</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !business.trim() || !audience.trim()}
              className="w-full flex items-center justify-center gap-3 bg-sky-500 text-white py-4 rounded-2xl font-bold hover:bg-sky-600 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/20"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Strategy
            </button>
          </div>

          <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10">
            <h4 className="font-bold text-amber-600 mb-2 flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Pro Tip
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The more specific you are about your audience's pain points, the better Ultrasnipps can tailor the offer to convert them into subscribers.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full min-h-[600px]">
              <div className="p-6 border-b border-black/5 bg-white/40 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generated Strategy</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm font-bold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Text
                    </>
                  )}
                </button>
              </div>
              <div className="p-10 flex-1 overflow-y-auto prose prose-sky max-w-none prose-p:text-slate-600 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-li:text-slate-600">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-white/40 rounded-[2rem] border-2 border-dashed border-black/5 h-full min-h-[600px] flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-black/5 rounded-3xl flex items-center justify-center mb-8 border border-black/5">
                <Target className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Your Strategy Awaits</h3>
              <p className="text-slate-400 max-w-xs leading-relaxed">
                Fill out the form on the left to generate a custom lead magnet and landing page copy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
