"use client";

import { useState } from "react";
import { PencilIcon, Trash2Icon, CheckIcon, XIcon } from "lucide-react";
import FileChip from "./FileChip";
import type { FileAttachment } from "../ChatArea";

interface UserMessageProps {
  content: string;
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  files?: FileAttachment[];
}

export default function UserMessage({ content, onEdit, onDelete, files }: UserMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === content) {
      setIsEditing(false);
      setEditValue(content);
      return;
    }
    onEdit?.(trimmed);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="flex w-full justify-end mb-6">
        <div className="max-w-[70%] w-full">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            rows={2}
            className="w-full bg-white/[0.05] border border-indigo-500/30 rounded-2xl px-4 py-3 text-white text-[13.5px] leading-normal resize-none focus:outline-none focus:border-indigo-500/60"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <XIcon size={12} />
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer"
            >
              <CheckIcon size={12} />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasFiles = files && files.length > 0;

  return (
    <div className="flex w-full justify-end mb-6 group">
      <div className="max-w-[70%]">
        {hasFiles && (
          <div className="flex flex-wrap gap-1.5 mb-2 justify-end">
            {files.map((f, i) => (
              <FileChip
                key={i}
                name={f.name}
                mimeType={f.mimeType}
                size={f.size}
                compact
              />
            ))}
          </div>
        )}
        <div
          className="px-[18px] py-3 text-white text-[13.5px] leading-normal"
          style={{
            background: "linear-gradient(135deg, #6366f1, #7c5cff)",
            borderRadius: "20px 20px 6px 20px",
            boxShadow: "0 2px 12px rgba(99,102,241,0.25)",
          }}
        >
          {content}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex justify-end gap-1 mt-1.5 mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer"
              >
                <PencilIcon size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <Trash2Icon size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
