import React from 'react';
import { X, Check, Zap, ShieldCheck, Sparkles, Star, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (tier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor') => void;
  currentTier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor';
}

export function UpgradeModal({ isOpen, onClose, onUpgrade, currentTier }: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = React.useState<string | null>(null);

  const handleUpgrade = async (tier: 'page' | 'knight' | 'duke' | 'monarch' | 'emperor') => {
    setIsUpgrading(tier);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    onUpgrade(tier);
    setIsUpgrading(null);
  };

  const plans = [
    {
      id: 'page',
      name: 'Page',
      tagline: 'Trial Expedition',
      price: '$5',
      period: '/mo',
      description: 'Perfect for exploring basic extraction.',
      features: [
        'Basic Email Extraction',
        'Basic Mobile Extraction',
        'Standard Deliverability',
        'Trial Access to Ultrasnipps',
      ],
      icon: Star,
      accent: 'slate'
    },
    {
      id: 'knight',
      name: 'Knight',
      tagline: 'Royal Scout',
      price: '$19',
      period: '/mo',
      description: 'Enhanced power for growing squires.',
      features: [
        'Advanced Extraction Suite',
        'Limited SMS Integration',
        '3 Active Campaigns',
        'Global Number Normalization',
        'Priority Support',
      ],
      icon: ShieldCheck,
      accent: 'sky'
    },
    {
      id: 'duke',
      name: 'Duke / Duchess',
      tagline: 'Regional Governor',
      price: '$75',
      period: '/mo',
      description: 'The ultimate power for high-volume senders.',
      features: [
        'Advanced Carrier Sorting',
        'Regional Filtering',
        'Bulk Data Exports',
        'Hunter.io Verification',
        '500 SMS Credits / month',
      ],
      icon: Sparkles,
      accent: 'indigo'
    },
    {
      id: 'monarch',
      name: 'Monarch',
      tagline: 'Supreme Ruler',
      price: '$199',
      period: '/mo',
      description: 'Command the realm with full power.',
      features: [
        'Unlimited SMS Delivery',
        'Advanced Analytics Engine',
        'Global Targeting Suite',
        'Video Studio Access',
        'SMTP Warmup Engine',
      ],
      icon: Crown,
      accent: 'amber',
      popular: true
    },
    {
      id: 'emperor',
      name: 'Emperor',
      tagline: 'Galactic Sovereign',
      price: '$499',
      period: '/mo',
      description: 'Enterprise suite for global domination.',
      features: [
        'Dedicated IP Address',
        'Priority Infrastructure',
        'White-label Reports',
        'Custom API Access',
        '24/7 Concierge Support',
      ],
      icon: Zap,
      accent: 'rose'
    }
  ];

  const getTierRank = (tier: string) => {
    const order = ['page', 'knight', 'duke', 'monarch', 'emperor'];
    return order.indexOf(tier);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-6xl bg-[#FDFCF0] rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden border border-black/5 my-8"
          >
            <div className="atmosphere-bg opacity-30" />
            
            <div className="relative z-10 p-8 lg:p-12">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-widest mb-4 border border-amber-500/20">
                    <Crown className="w-3 h-3" />
                    Royal Ascension
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Ascend to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-sky-500">Rightful Throne</span>.
                  </h2>
                  <p className="text-slate-500 text-sm md:text-base mt-2 max-w-2xl">
                    Choose your rank and unlock the most perfect delivery engine and Ultrasnipps Intelligence to scale your outreach.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-black/5 rounded-full transition-all text-slate-300 hover:text-slate-900"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                  const isCurrent = currentTier === plan.id;
                  const isDowngrade = getTierRank(plan.id) < getTierRank(currentTier);
                  const isUpgrade = getTierRank(plan.id) > getTierRank(currentTier);
                  
                  return (
                    <div 
                      key={plan.id}
                      className={cn(
                        "relative p-8 rounded-[2rem] border transition-all duration-500 flex flex-col",
                        plan.popular 
                          ? "bg-white shadow-2xl shadow-amber-500/10 border-amber-500/20 scale-[1.02] z-10" 
                          : "bg-white/40 border-black/5 hover:bg-white/60"
                      )}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20">
                          Most Regal
                        </div>
                      )}

                      <div className="mb-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg",
                          plan.accent === 'slate' && "bg-slate-100 text-slate-500 shadow-slate-500/10",
                          plan.accent === 'sky' && "bg-sky-500/10 text-sky-500 shadow-sky-500/10",
                          plan.accent === 'indigo' && "bg-indigo-500/10 text-indigo-500 shadow-indigo-500/10",
                          plan.accent === 'amber' && "bg-amber-500/10 text-amber-500 shadow-amber-500/10",
                          plan.accent === 'rose' && "bg-rose-500/10 text-rose-500 shadow-rose-500/10"
                        )}>
                          <plan.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{plan.tagline}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 tracking-tight">{plan.price}</span>
                          {plan.period && <span className="text-slate-400 font-bold text-xs">{plan.period}</span>}
                        </div>
                      </div>

                      <div className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className={cn(
                              "mt-1 p-0.5 rounded-full",
                              plan.accent === 'slate' && "bg-slate-200 text-slate-400",
                              plan.accent === 'sky' && "bg-sky-500 text-white",
                              plan.accent === 'indigo' && "bg-indigo-500 text-white",
                              plan.accent === 'amber' && "bg-amber-500 text-white",
                              plan.accent === 'rose' && "bg-rose-500 text-white"
                            )}>
                              <Check className="w-2.5 h-2.5" />
                            </div>
                            <span className="text-sm text-slate-600 font-medium leading-tight">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => isUpgrade ? handleUpgrade(plan.id as any) : undefined}
                        disabled={isCurrent || isDowngrade || isUpgrading !== null}
                        className={cn(
                          "w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                          isCurrent 
                            ? "bg-slate-100 text-slate-400 cursor-default"
                            : isDowngrade
                              ? "bg-slate-50 text-slate-300 cursor-default"
                              : plan.accent === 'amber'
                                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                                : plan.accent === 'indigo'
                                  ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
                                  : plan.accent === 'sky'
                                  ? "bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20"
                                  : plan.accent === 'rose'
                                    ? "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                                    : "bg-slate-900 text-white hover:bg-black"
                        )}
                      >
                        {isUpgrading === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {isCurrent ? 'Current Rank' : isDowngrade ? 'Lower Rank' : `Ascend to ${plan.name}`}
                            {isUpgrade && <ArrowRight className="w-3.5 h-3.5" />}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Secure payment processing. Cancel anytime.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
