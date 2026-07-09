import React, { useState } from 'react';
import { Modal } from './Modal';
import { Search, Globe, Shield, Zap, Mail, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface Provider {
  name: string;
  id: string;
  domain?: string;
  description?: string;
  tags?: string[];
}

interface DirectoryCategory {
  title: string;
  icon: React.ReactNode;
  providers: Provider[];
}

const GLOBAL_PROVIDERS: DirectoryCategory[] = [
  {
    title: "Global Giants",
    icon: <Globe className="w-4 h-4" />,
    providers: [
      { id: "gmail", name: "Google Mail", domain: "gmail.com", description: "World's most popular email service" },
      { id: "outlook", name: "Microsoft Outlook", domain: "outlook.com", description: "Enterprise-grade connectivity" },
      { id: "yahoo", name: "Yahoo Mail", domain: "yahoo.com", description: "Classic global service" },
      { id: "icloud", name: "Apple iCloud", domain: "icloud.com", description: "Privacy-focused Apple ecosystem" },
      { id: "aol", name: "AOL Mail", domain: "aol.com", description: "Legendary US provider" },
    ]
  },
  {
    title: "Privacy & Encryption",
    icon: <Shield className="w-4 h-4" />,
    providers: [
      { id: "protonmail", name: "Proton Mail", domain: "proton.me", description: "Swiss-based end-to-end encryption" },
      { id: "tutanota", name: "Tuta (Tutanota)", domain: "tuta.com", description: "Secure German infrastructure" },
      { id: "skiff", name: "Skiff Mail", domain: "skiff.com", description: "Web3 integrated privacy" },
      { id: "startmail", name: "StartMail", domain: "startmail.com", description: "Dutch private search engine partner" },
      { id: "mailbox.org", name: "Mailbox.org", domain: "mailbox.org", description: "Premium German privacy" },
    ]
  },
  {
    title: "European Regions",
    icon: <Mail className="w-4 h-4" />,
    providers: [
      { id: "gmx", name: "GMX Mail", domain: "gmx.net", description: "Primary German provider" },
      { id: "web.de", name: "WEB.DE", domain: "web.de", description: "German standard inbox" },
      { id: "orange.fr", name: "Orange Mail", domain: "orange.fr", description: "France's leading carrier mail" },
      { id: "libero.it", name: "Libero Mail", domain: "libero.it", description: "Italia's favorite webmail" },
      { id: "mail.ru", name: "Mail.ru", domain: "mail.ru", description: "Russia's largest communication portal" },
      { id: "yandex", name: "Yandex Mail", domain: "yandex.ru", description: "Tech-giant email from Russia" },
      { id: "seznam", name: "Seznam.cz", domain: "seznam.cz", description: "Czech Republic portal" },
      { id: "onet.pl", name: "Onet Poczta", domain: "onet.pl", description: "Poland's leading service" },
    ]
  },
  {
    title: "Asian Regions",
    icon: <Zap className="w-4 h-4" />,
    providers: [
      { id: "naver", name: "Naver Mail", domain: "naver.com", description: "South Korea's primary search engine mail" },
      { id: "daum", name: "Daum Mail", domain: "daum.net", description: "South Korean classic portal" },
      { id: "163", name: "NetEase 163", domain: "163.com", description: "China's leading free mail" },
      { id: "qq", name: "Tencent QQ Mail", domain: "qq.com", description: "China's massive IM-integrated mail" },
      { id: "sina", name: "Sina Mail", domain: "sina.com", description: "Chinese microblogging portal" },
      { id: "rediff", name: "Rediffmail", domain: "rediff.com", description: "India's homegrown favorite" },
    ]
  },
  {
    title: "Specialized & Tech",
    icon: <ChevronRight className="w-4 h-4" />,
    providers: [
      { id: "fastmail", name: "Fastmail", domain: "fastmail.com", description: "Professional, fast, efficient" },
      { id: "zoho", name: "Zoho Mail", domain: "zoho.com", description: "Suite-integrated business mail" },
      { id: "hey", name: "Hey.com", domain: "hey.com", description: "The unconventional Basecamp mail" },
      { id: "rackspace", name: "Rackspace", domain: "rackspace.com", description: "Managed enterprise cloud mail" },
      { id: "dreamhost", name: "DreamHost", domain: "dreamhost.com", description: "Managed hosting email services" },
    ]
  }
];

interface ProviderDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: string) => void;
  title?: string;
}

export function ProviderDirectory({ isOpen, onClose, onSelect, title = "Intelligence Library: Global Domains" }: ProviderDirectoryProps) {
  const [search, setSearch] = useState('');

  const filteredCategories = GLOBAL_PROVIDERS.map(cat => ({
    ...cat,
    providers: cat.providers.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.domain?.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.providers.length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-8 max-h-[70vh] flex flex-col">
        <div className="relative group shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search thousands of global domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-black/10 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
          />
        </div>

        <div className="overflow-y-auto pr-2 space-y-10 custom-scrollbar">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, idx) => (
              <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1.5 bg-black/5 rounded-lg text-slate-400">
                    {category.icon}
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{category.title}</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        onSelect(provider.id);
                        onClose();
                      }}
                      className="flex flex-col items-start text-left p-4 rounded-2xl bg-white border border-black/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{provider.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mb-2">{provider.domain}</div>
                      <p className="text-[10px] text-slate-500 leading-tight line-clamp-1">{provider.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="font-bold text-slate-900 tracking-tight">No Intelligence Matches</p>
                <p className="text-xs text-slate-400">Try searching for a different domain or region.</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-black/5 shrink-0">
          <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
            <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-normal">
              <strong>Can't find your provider?</strong> Select "Custom IMAP" back in the extractor and provide your server details manually. We support all RFC-compliant email infrastructures.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
