"use client";

import { FileText, Download, FileCheck } from "lucide-react";

interface PdfPreviewCardProps {
  fileName: string;
  url: string;
  pageCount: number;
  fileSize: string;
}

export default function PdfPreviewCard({ fileName, url, pageCount, fileSize }: PdfPreviewCardProps) {
  const displayName = fileName
    .replace(/-\d+\.pdf$/, ".pdf")
    .replace(/-/g, " ")
    .replace(/\.pdf$/i, "");

  const handleDownload = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const token = localStorage.getItem("accessToken");

    fetch(`${baseUrl}${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden max-w-sm">
      <div className="flex items-start gap-3 p-3.5">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <FileText size={20} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate capitalize">{displayName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            PDF &middot; {pageCount} {pageCount === 1 ? "page" : "pages"} &middot; {fileSize}
          </p>
        </div>
      </div>

      <div className="border-t border-white/5 px-3.5 py-2.5 flex items-center gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-medium cursor-pointer"
        >
          <Download size={14} />
          Download
        </button>
        <div className="flex items-center gap-1 text-xs text-green-400">
          <FileCheck size={13} />
          Ready
        </div>
      </div>
    </div>
  );
}
