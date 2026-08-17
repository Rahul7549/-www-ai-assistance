"use client";

import { FileIcon, ImageIcon, X } from "lucide-react";

interface FileChipProps {
  name: string;
  mimeType: string;
  size: number;
  preview?: string;
  onRemove: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileChip({ name, mimeType, size, preview, onRemove }: FileChipProps) {
  const isImage = mimeType.startsWith("image/");

  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs max-w-[200px]">
      {isImage && preview ? (
        <img src={preview} alt={name} className="w-8 h-8 rounded object-cover shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center shrink-0">
          {isImage ? <ImageIcon size={14} className="text-indigo-400" /> : <FileIcon size={14} className="text-indigo-400" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-white/80 truncate">{name}</p>
        <p className="text-white/30">{formatSize(size)}</p>
      </div>
      <button onClick={onRemove} className="text-white/30 hover:text-white/60 shrink-0 cursor-pointer">
        <X size={14} />
      </button>
    </div>
  );
}
