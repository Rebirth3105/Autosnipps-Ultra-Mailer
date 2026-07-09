import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative glass-panel w-full max-w-xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden border-black/5"
          >
            <div className="px-10 py-8 border-b border-black/5 flex items-center justify-between bg-white/40">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight text-glow">{title}</h3>
              <button 
                onClick={onClose} 
                className="p-2.5 hover:bg-black/5 rounded-full transition-all text-slate-400 hover:text-slate-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-10">
              {children}
            </div>

            {footer && (
              <div className="px-10 py-8 bg-white/40 border-t border-black/5 flex items-center justify-end gap-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
