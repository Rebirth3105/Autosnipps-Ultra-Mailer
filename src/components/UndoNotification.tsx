import React, { useEffect, useState } from 'react';
import { Undo2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UndoNotificationProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoNotification({ message, onUndo, onDismiss, duration = 5000 }: UndoNotificationProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 min-w-[400px]"
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden w-full">
          <motion.div 
            className="h-full bg-sky-500"
            initial={{ width: "100%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "linear" }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-xl text-sm font-bold transition-colors"
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </button>
        <button
          onClick={onDismiss}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </motion.div>
  );
}
