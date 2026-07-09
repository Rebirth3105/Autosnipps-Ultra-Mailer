import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from '../services/gemini';
import { Message } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ChatAssistantProps {
  onClose?: () => void;
}

export function ChatAssistant({ onClose }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      text: "Welcome to **Autosnipps**! 🚀 I'm your Smart Assistant. We've recently added powerful new features including **Undo functionality** for deletions, **Campaign Scheduling**, and **Advanced Tag Management** for your recipients. How can I help you optimize your campaigns today?", 
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const response = await getGeminiResponse(input, history);
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response || 'Sorry, I encountered an error.', timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-3xl border-l border-black/5 w-[420px] shadow-2xl relative z-50">
      <div className="p-8 border-b border-black/5 flex items-center justify-between bg-white/40">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 tracking-tight">Smart Assistant</h2>
            <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold">Powered by Ultrasnipps Engine</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-xl transition-colors text-slate-300 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "max-w-[85%] p-5 rounded-3xl text-[13px] leading-relaxed",
              msg.role === 'user' 
                ? "bg-amber-500 text-white rounded-tr-none shadow-xl shadow-amber-500/10" 
                : "bg-white/60 text-slate-800 rounded-tl-none border border-black/5"
            )}>
              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/5 prose-pre:text-slate-900 prose-strong:text-slate-900 prose-code:text-amber-600 prose-headings:text-slate-900 prose-headings:font-bold">
                <ReactMarkdown>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
            <span className="mt-2 text-[9px] text-slate-300 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 text-slate-300 text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse pl-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing request...
          </div>
        )}
      </div>

      <div className="p-8 border-t border-black/5 bg-white/40">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="How can I help you today?"
            className="w-full p-5 pr-16 bg-white/60 border border-black/5 rounded-3xl text-[13px] text-slate-900 focus:ring-2 focus:ring-amber-500/50 outline-none resize-none h-32 transition-all placeholder:text-slate-300"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-4 bottom-4 p-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 disabled:opacity-50 transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
