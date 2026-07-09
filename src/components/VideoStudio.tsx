import React, { useState } from 'react';
import { Video, Sparkles, Play, Download, Loader2, AlertTriangle, CheckCircle2, Crown, Info } from 'lucide-react';
import { generateVideoAd } from '../services/gemini';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface VideoStudioProps {
  userTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
  onUpgradeClick: () => void;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export function VideoStudio({ userTier, onUpgradeClick }: VideoStudioProps) {
  const [prompt, setPrompt] = useState('A cinematic, high-end commercial for a royal email marketing platform. Golden particles floating in a deep blue digital space, sleek glass interfaces showing rising growth charts, professional and authoritative atmosphere.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMonarchOrHigher = userTier === 'monarch' || userTier === 'emperor';

  const handleGenerate = async () => {
    if (!isMonarchOrHigher) return;
    
    setError(null);
    setVideoUrl(null);
    
    try {
      // Check for API key as per Veo requirements
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // Proceeding as per guidelines: "assume the key selection was successful... and proceed"
        }
      }

      setIsGenerating(true);
      const url = await generateVideoAd(prompt, (s) => setStatus(s));
      setVideoUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video. Please ensure you have a valid API key selected.");
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      <div className="glass-panel rounded-[2.5rem] p-12 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold uppercase tracking-[0.2em] mb-6 border border-amber-500/20">
            <Crown className="w-3 h-3" />
            Monarch Creative Studio
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-8 leading-[1.1] tracking-tight text-glow text-slate-900">
            Generate <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-sky-500">Cinematic</span> Video Ads.
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-10 font-medium max-w-2xl">
            Harness the power of Veo to create high-definition video advertisements for your brand. 
            Describe your vision, and our AI will render a professional demo in minutes.
          </p>
        </div>
        <div className="absolute right-[-10%] top-[-20%] w-[60%] h-[140%] bg-gradient-to-br from-amber-500/10 to-sky-500/10 blur-[120px] rounded-full group-hover:opacity-100 opacity-50 transition-opacity duration-1000" />
      </div>

      {!isMonarchOrHigher ? (
        <div className="glass-panel p-12 rounded-[3rem] text-center space-y-8 border-amber-500/20 bg-amber-500/5">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-900">Exclusive Monarch Feature</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Video Ad Generation requires the **Monarch** rank or higher. Ascend to unlock cinematic AI video creation and high-definition rendering.
            </p>
          </div>
          <button 
            onClick={onUpgradeClick}
            className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-bold text-sm hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
          >
            Ascend to Monarch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="glass-panel p-10 rounded-[2.5rem] space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500 rounded-2xl shadow-lg shadow-sky-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg tracking-tight">Creative Prompt</h4>
                  <p className="text-sm text-slate-400">Describe the atmosphere and visual style of your ad.</p>
                </div>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your video ad..."
                className="w-full h-48 px-6 py-5 bg-white/60 border border-black/5 rounded-[2rem] text-sm text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-300 resize-none leading-relaxed"
              />

              <div className="p-6 rounded-2xl bg-sky-500/5 border border-sky-500/10 flex gap-4">
                <Info className="w-5 h-5 text-sky-500 shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Video generation is a high-compute task. It may take 2-5 minutes to render your 1080p cinematic demo. 
                  Ensure your API key is from a paid Google Cloud project.
                </p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-5 bg-amber-500 text-white rounded-[2rem] font-bold text-base hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="w-6 h-6" />
                    Render Video Ad
                  </>
                )}
              </button>

              {status && (
                <p className="text-center text-xs font-bold text-amber-600 animate-pulse uppercase tracking-widest">
                  {status}
                </p>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-600 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-panel p-10 rounded-[2.5rem] h-full flex flex-col min-h-[500px] relative overflow-hidden">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/60 rounded-2xl border border-black/10">
                    <Play className="w-6 h-6 text-slate-500" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg tracking-tight">Preview</h4>
                </div>
                {videoUrl && (
                  <a
                    href={videoUrl}
                    download="ultrasnipps-ad.mp4"
                    className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center relative z-10">
                <AnimatePresence mode="wait">
                  {videoUrl ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full aspect-video rounded-[2rem] overflow-hidden shadow-2xl border border-black/5 bg-black"
                    >
                      <video
                        src={videoUrl}
                        controls
                        className="w-full h-full object-cover"
                        autoPlay
                      />
                    </motion.div>
                  ) : isGenerating ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center space-y-6"
                    >
                      <div className="relative">
                        <div className="w-24 h-24 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                        <Crown className="w-8 h-8 text-amber-500 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-900 font-bold">Rendering Masterpiece</p>
                        <p className="text-xs text-slate-400">Our creative engine is weaving your vision...</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center space-y-6 opacity-40">
                      <Video className="w-20 h-20 text-slate-300 mx-auto" />
                      <p className="text-sm font-medium text-slate-400">Your rendered ad will appear here.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-sky-500/5 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
