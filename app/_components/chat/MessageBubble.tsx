"use client";

import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  if (role === "user") {
    return <UserMessage content={content} />;
  }
  return <AssistantMessage content={content} isStreaming={isStreaming} />;
}
