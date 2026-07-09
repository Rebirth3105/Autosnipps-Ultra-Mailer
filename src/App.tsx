import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LeadGen } from './components/LeadGen';
import { EmailExtractor } from './components/EmailExtractor';
import { MobileExtractor } from './components/MobileExtractor';
import { DeliverabilityCenter } from './components/DeliverabilityCenter';
import { SettingsView } from './components/SettingsView';
import { VideoStudio } from './components/VideoStudio';
import { ChatAssistant } from './components/ChatAssistant';
import { CampaignCreator } from './components/CampaignCreator';
import { CampaignsView } from './components/CampaignsView';
import { RecipientsView } from './components/RecipientsView';
import { UndoNotification } from './components/UndoNotification';
import { UpgradeModal } from './components/UpgradeModal';
import { TaskExtractor } from './components/TaskExtractor';
import { Mail, Plus, Search, Filter, MoreVertical, Edit2, Trash2, Send, BarChart3, Settings, Bell, ChevronDown, Sparkles, LogIn, Github, Chrome, Key } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { auth, signInWithGoogle, logout, getUserProfile, createUserProfile, validateTokenAndLogin, UserProfile } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db } from './services/firebase';
import { setDoc, doc, getDoc, Timestamp } from 'firebase/firestore';

interface UndoAction {
  id: string;
  type: 'delete_campaign' | 'delete_recipient' | 'update_tags';
  message: string;
  data: any;
  undo: () => void;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  
  // Auth & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginToken, setLoginToken] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [userTier, setUserTier] = useState<'page' | 'knight' | 'duke' | 'monarch' | 'emperor'>('page');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userProfile = await getUserProfile(currentUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          setUserTier(userProfile.tier);
        } else {
          const newProfile = await createUserProfile(currentUser);
          setProfile(newProfile);
          setUserTier(newProfile.tier);
        }
      } else {
        setProfile(null);
        setUserTier('page');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setLoginError("Google Sign-in failed. Please try again.");
    }
  };

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail || !loginToken) {
      setLoginError("Please enter both email and token.");
      return;
    }

    try {
      setLoading(true);
      // Hardcoded Demo Fallback for User Review
      if (loginEmail === 'commander@ultrasnipps.com' && loginToken === 'ULTRA-DEMO-2026') {
        const demoProfile: UserProfile = {
          uid: 'demo-commander-unique-id',
          email: 'commander@ultrasnipps.com',
          displayName: 'Demo Commander',
          tier: 'emperor',
          usageCount: 0,
          maxUsage: 9999,
          emailVerified: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          token: 'ULTRA-DEMO-2026'
        };
        setProfile(demoProfile);
        setUserTier(demoProfile.tier);
        setUser({ uid: demoProfile.uid, email: demoProfile.email, displayName: demoProfile.displayName } as any);
        return;
      }

      const userProfile = await validateTokenAndLogin(loginEmail, loginToken);
      if (userProfile) {
        // For the demo, we set the profile directly. 
        // Note: In production, we'd use Firestore custom tokens to authenticate the actual Auth state.
        setProfile(userProfile);
        setUserTier(userProfile.tier);
        // We simulate a logged in state for the UI
        setUser({ uid: userProfile.uid, email: userProfile.email, displayName: userProfile.displayName } as any);
      } else {
        setLoginError("Invalid Email or Purchase Token. Please check your credentials.");
      }
    } catch (err) {
      console.error("Token login failed", err);
      setLoginError("System error during token verification.");
    } finally {
      setLoading(false);
    }
  };

  const triggerUndo = useCallback((action: UndoAction) => {
    setUndoAction(action);
  }, []);

  const handleUndo = () => {
    if (undoAction) {
      undoAction.undo();
      setUndoAction(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#FDFCF0] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initializing Ultrasnipps...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen bg-[#FDFCF0] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="atmosphere-bg opacity-30" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/40 backdrop-blur-xl border border-black/5 rounded-[2.5rem] p-10 shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-sky-500 rounded-3xl shadow-xl shadow-amber-500/20 flex items-center justify-center mb-6 group cursor-pointer">
              <Sparkles className="w-10 h-10 text-white transition-transform group-hover:rotate-12" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Ultrasnipps</h1>
            <p className="text-slate-400 text-sm font-medium">The Elite Email & Mobile Harvest Command Center</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-slate-900 text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg group"
            >
              <Chrome className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Sign in with Google
            </button>
            <div className="flex items-center gap-4 py-4">
              <div className="h-[1px] flex-1 bg-black/5" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or use access token</span>
              <div className="h-[1px] flex-1 bg-black/5" />
            </div>
            <form onSubmit={handleTokenLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email"
                  placeholder="Email Address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white/60 border border-black/5 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password"
                  placeholder="Purchase Token"
                  value={loginToken}
                  onChange={(e) => setLoginToken(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white/60 border border-black/5 rounded-xl text-sm focus:bg-white outline-none transition-all"
                />
              </div>
              <button className="w-full h-12 bg-white border border-black/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                Enter Command Center
              </button>
            </form>
            {loginError && (
              <p className="text-[10px] text-rose-500 font-bold text-center mt-4 bg-rose-50 py-2 rounded-lg border border-rose-100">
                {loginError}
              </p>
            )}
          </div>
          
          <div className="mt-8 pt-8 border-t border-black/5 text-center">
            <p className="text-slate-400 text-xs font-medium">No account? Tokens are generated automatically upon subscription.</p>
          </div>
        </motion.div>

        {/* Global Stats Overlay */}
        <div className="fixed bottom-8 flex gap-8 opacity-40 pointer-events-none">
          <div className="text-center">
            <div className="text-lg font-black text-slate-900 tracking-tighter">1.2M+</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Harvested</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-slate-900 tracking-tighter">99.8%</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-slate-900 tracking-tighter">Instant</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Extraction</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FDFCF0] font-sans text-slate-900 overflow-hidden relative">
      <div className="atmosphere-bg" />
      
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userTier={userTier}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-20 bg-white/40 backdrop-blur-md border-b border-black/5 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6 flex-1 max-w-2xl">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <input
                type="text"
                placeholder="Search campaigns, recipients, or strategies..."
                className="w-full pl-12 pr-4 py-2.5 bg-white/60 border border-black/5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-slate-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsAssistantOpen(!isAssistantOpen)}
              className={cn(
                "p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 group",
                isAssistantOpen 
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/40" 
                  : "bg-white/60 text-slate-400 hover:text-slate-900 hover:bg-white"
              )}
            >
              <Sparkles className={cn("w-5 h-5", isAssistantOpen ? "animate-pulse" : "group-hover:rotate-12 transition-transform")} />
              <span className="text-xs font-bold uppercase tracking-widest px-1">Assistant</span>
            </button>
            <div className="h-8 w-[1px] bg-black/5 mx-2" />
            <button 
              onClick={() => setActiveTab('settings')}
              className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white/60 rounded-xl transition-all"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div 
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-3 pl-2 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-sky-500 border border-white/20 shadow-lg shadow-amber-500/20 flex items-center justify-center font-bold text-sm tracking-tight group-hover:scale-105 transition-transform text-white overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.displayName?.substring(0, 2).toUpperCase() || 'AA'
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard 
                userTier={userTier} 
                onUpgradeClick={() => setIsUpgradeModalOpen(true)} 
                onNewCampaign={() => setIsCreating(true)}
                onViewAnalytics={() => setActiveTab('analytics')}
              />
            )}
            {activeTab === 'campaigns' && (
              <CampaignsView 
                onNew={() => setIsCreating(true)} 
                onDelete={(id) => {
                  triggerUndo({
                    id: Math.random().toString(),
                    type: 'delete_campaign',
                    message: 'Campaign deleted successfully',
                    data: { id },
                    undo: () => console.log('Undoing campaign delete:', id)
                  });
                }}
                onSchedule={(id, date) => {
                  console.log('Scheduled:', id, date);
                }}
              />
            )}
            {activeTab === 'recipients' && (
              <RecipientsView 
                onDelete={(id) => {
                  triggerUndo({
                    id: Math.random().toString(),
                    type: 'delete_recipient',
                    message: 'Recipient removed from list',
                    data: { id },
                    undo: () => console.log('Undoing recipient delete:', id)
                  });
                }}
                onUpdateTags={(id, tags) => {
                  console.log('Tags updated:', id, tags);
                }}
              />
            )}
            {activeTab === 'leadgen' && <LeadGen />}
            {activeTab === 'extractor' && <EmailExtractor userTier={userTier} />}
            {activeTab === 'mobile-extractor' && <MobileExtractor userTier={userTier} />}
            {activeTab === 'task-extractor' && <TaskExtractor userTier={userTier} />}
            {activeTab === 'video-studio' && (
              <VideoStudio 
                userTier={userTier} 
                onUpgradeClick={() => setIsUpgradeModalOpen(true)}
              />
            )}
            {activeTab === 'deliverability' && <DeliverabilityCenter userTier={userTier} />}
            {activeTab === 'analytics' && (
              <div className="flex flex-col items-center justify-center h-[60vh] glass-panel rounded-3xl p-20 text-center">
                <BarChart3 className="w-24 h-24 mb-6 text-sky-400 opacity-50 animate-pulse" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900">Analytics Engine Powering Up</h2>
                <p className="text-slate-400 max-w-md text-sm md:text-base">Our advanced tracking system is gathering data from your latest campaigns. Check back soon for deep insights.</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <SettingsView 
                userTier={userTier} 
                onUpgradeClick={() => setIsUpgradeModalOpen(true)}
                profile={profile}
              />
            )}
          </div>
        </div>
      </main>

      {/* Smart Assistant Sidebar */}
      <AnimatePresence>
        {isAssistantOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50"
          >
            <ChatAssistant onClose={() => setIsAssistantOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {isCreating && (
        <CampaignCreator 
          onClose={() => setIsCreating(false)} 
          onSave={(c) => {
            console.log('Saved:', c);
            setIsCreating(false);
          }} 
          userTier={userTier}
        />
      )}

      <UpgradeModal 
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentTier={userTier}
        onUpgrade={(tier) => {
          setUserTier(tier);
          setIsUpgradeModalOpen(false);
        }}
      />

      {/* Notifications */}
      <AnimatePresence>
        {undoAction && (
          <UndoNotification
            key={undoAction.id}
            message={undoAction.message}
            onUndo={handleUndo}
            onDismiss={() => setUndoAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
