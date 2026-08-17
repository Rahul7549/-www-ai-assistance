"use client";

import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";
import type { PdfAttachment, FileAttachment } from "../ChatArea";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  assistantName?: string;
  assistantAvatar?: string;
  showHeader?: boolean;
  pdfAttachment?: PdfAttachment;
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  sourceFiles?: string[];
  files?: FileAttachment[];
}

export default function MessageBubble({ role, content, isStreaming, assistantName, assistantAvatar, showHeader = true, pdfAttachment, onEdit, onDelete, sourceFiles, files }: MessageBubbleProps) {
  if (role === "user") {
    return <UserMessage content={content} onEdit={onEdit} onDelete={onDelete} files={files} />;
  }
  return <AssistantMessage content={content} isStreaming={isStreaming} assistantName={assistantName} assistantAvatar={assistantAvatar} showHeader={showHeader} pdfAttachment={pdfAttachment} sourceFiles={sourceFiles} />;
}
