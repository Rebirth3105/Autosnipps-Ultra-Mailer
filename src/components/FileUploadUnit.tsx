import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadUnitProps {
  onFileLoaded: (content: string) => void;
  onClear: () => void;
  acceptedTypes?: string;
}

export function FileUploadUnit({ onFileLoaded, onClear, acceptedTypes = ".txt,.csv,.json,.docx" }: FileUploadUnitProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content);
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center gap-4 group cursor-pointer",
          isDragging ? "border-amber-500 bg-amber-500/5" : "border-black/5 bg-black/5 hover:border-black/10",
          file ? "border-emerald-500/30 bg-emerald-500/5" : ""
        )}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedTypes}
          className="hidden"
        />

        {file ? (
          <>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{file.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">{(file.size / 1024).toFixed(1)} KB • READY</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm text-slate-400 hover:text-rose-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Drag & Drop Intelligence File</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Supports TXT, CSV, JSON, DOCX</p>
            </div>
            <button className="px-6 py-2 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all">
              Browse Local Drives
            </button>
          </>
        )}
      </div>
    </div>
  );
}
