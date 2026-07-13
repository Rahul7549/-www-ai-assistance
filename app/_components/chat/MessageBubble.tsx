"use client";

import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  assistantName?: string;
  assistantAvatar?: string;
  showHeader?: boolean;
}

export default function MessageBubble({ role, content, isStreaming, assistantName, assistantAvatar, showHeader = true }: MessageBubbleProps) {
  if (role === "user") {
    return <UserMessage content={content} />;
  }
  return <AssistantMessage content={content} isStreaming={isStreaming} assistantName={assistantName} assistantAvatar={assistantAvatar} showHeader={showHeader} />;
}
