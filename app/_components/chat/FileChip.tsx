"use client";

import { FileTextIcon, ImageIcon, TableIcon, PresentationIcon, X } from "lucide-react";

interface FileChipProps {
  name: string;
  mimeType: string;
  size: number;
  preview?: string;
  onRemove?: () => void;
  compact?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <TableIcon size={18} className="text-emerald-400" />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return <PresentationIcon size={18} className="text-orange-400" />;
  if (mimeType === "application/pdf")
    return <FileTextIcon size={18} className="text-red-400" />;
  if (mimeType.includes("word"))
    return <FileTextIcon size={18} className="text-blue-400" />;
  return <FileTextIcon size={18} className="text-indigo-400" />;
}

function getFileAccent(mimeType: string) {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return { bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return { bg: "bg-orange-500/10", border: "border-orange-500/20" };
  if (mimeType === "application/pdf")
    return { bg: "bg-red-500/10", border: "border-red-500/20" };
  if (mimeType.includes("word"))
    return { bg: "bg-blue-500/10", border: "border-blue-500/20" };
  return { bg: "bg-indigo-500/10", border: "border-indigo-500/20" };
}

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : "";
}

export default function FileChip({ name, mimeType, size, preview, onRemove, compact }: FileChipProps) {
  const isImage = mimeType.startsWith("image/");

  if (isImage && preview) {
    return (
      <div className={`relative group/chip ${compact ? "w-16 h-16" : "w-24 h-24"} rounded-xl overflow-hidden border border-white/10 shrink-0`}>
        <img src={preview} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/chip:opacity-100 transition-opacity" />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/80 opacity-0 group-hover/chip:opacity-100 transition-opacity cursor-pointer"
          >
            <X size={12} />
          </button>
        )}
        {!compact && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
            <p className="text-[10px] text-white/80 truncate">{name}</p>
          </div>
        )}
      </div>
    );
  }

  if (isImage && !preview) {
    const accent = { bg: "bg-purple-500/10", border: "border-purple-500/20" };
    return (
      <div className={`relative group/chip flex items-center gap-2.5 ${accent.bg} border ${accent.border} rounded-xl ${compact ? "px-2.5 py-1.5" : "px-3 py-2.5"} shrink-0`}>
        <div className={`${compact ? "w-7 h-7" : "w-9 h-9"} rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0`}>
          <ImageIcon size={compact ? 14 : 18} className="text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className={`${compact ? "text-[11px]" : "text-xs"} text-white/90 font-medium truncate max-w-[140px]`}>{name}</p>
          {!compact && <p className="text-[10px] text-white/40">{formatSize(size)}</p>}
        </div>
        {onRemove && (
          <button onClick={onRemove} className="ml-1 p-0.5 rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors cursor-pointer shrink-0">
            <X size={12} />
          </button>
        )}
      </div>
    );
  }

  const accent = getFileAccent(mimeType);
  const ext = getExtension(name);

  return (
    <div className={`relative group/chip flex items-center gap-2.5 ${accent.bg} border ${accent.border} rounded-xl ${compact ? "px-2.5 py-1.5" : "px-3 py-2.5"} shrink-0`}>
      <div className={`${compact ? "w-7 h-7" : "w-9 h-9"} rounded-lg bg-white/5 flex items-center justify-center shrink-0 relative`}>
        {getFileIcon(mimeType)}
        {ext && !compact && (
          <span className="absolute -bottom-0.5 -right-0.5 text-[7px] font-bold bg-white/10 rounded px-0.5 text-white/60 uppercase leading-none py-px">
            {ext}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className={`${compact ? "text-[11px]" : "text-xs"} text-white/90 font-medium truncate max-w-[140px]`}>{name}</p>
        {!compact && <p className="text-[10px] text-white/40">{formatSize(size)}</p>}
      </div>
      {onRemove && (
        <button onClick={onRemove} className="ml-1 p-0.5 rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors cursor-pointer shrink-0">
          <X size={12} />
        </button>
      )}
    </div>
  );
}
