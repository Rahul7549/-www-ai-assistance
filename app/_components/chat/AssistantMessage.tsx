"use client";

import { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { CopyIcon, RotateCcwIcon, SparklesIcon } from "lucide-react";
import CodeBlock from "./CodeBlock";
import PdfPreviewCard from "./PdfPreviewCard";
import type { PdfAttachment } from "../ChatArea";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
  assistantName?: string;
  assistantAvatar?: string;
  showHeader?: boolean;
  pdfAttachment?: PdfAttachment;
  sourceFiles?: string[];
}

export default function AssistantMessage({ content, isStreaming, assistantName = "Nova", assistantAvatar, showHeader = true, pdfAttachment, sourceFiles }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);

  const isError = content.startsWith("Error: ");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const avatarSrc = assistantAvatar && assistantAvatar !== "default"
    ? `/avatars/${assistantAvatar.toLowerCase()}.png`
    : null;

  if (isError) {
    return (
      <div className="flex gap-2.5 items-center px-4 py-2.5 rounded-[10px] mb-6 bg-red-500/[0.08] border border-red-500/[0.15]">
        <div className="w-[18px] h-[18px] rounded-full bg-red-500/[0.15] flex items-center justify-center text-[11px] text-red-400 font-bold shrink-0">
          !
        </div>
        <span className="text-xs text-red-400/80">{content.replace("Error: ", "")}</span>
      </div>
    );
  }

  const markdownComponents: Components = {
    pre({ children }) {
      return <>{children}</>;
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");

      if (match) {
        return <CodeBlock language={match[1]}>{codeString}</CodeBlock>;
      }

      return (
        <code className="bg-[rgba(124,92,255,0.12)] text-[#c4b5fd] px-[7px] py-0.5 rounded-[5px] text-xs font-mono border border-[rgba(124,92,255,0.15)]">
          {children}
        </code>
      );
    },
    strong({ children }) {
      return <strong className="text-white font-semibold">{children}</strong>;
    },
    em({ children }) {
      return <em className="text-white/60 italic">{children}</em>;
    },
    p({ children }) {
      return <p className="mb-2.5 last:mb-0">{children}</p>;
    },
    ol({ children }) {
      return <ol className="my-2 mb-3 pl-[22px] list-decimal marker:text-[rgba(124,92,255,0.6)]">{children}</ol>;
    },
    ul({ children }) {
      return <ul className="my-2 mb-3 pl-[22px] list-disc marker:text-[rgba(124,92,255,0.6)]">{children}</ul>;
    },
    li({ children }) {
      return <li className="mb-2">{children}</li>;
    },
    a({ href, children }) {
      return (
        <a href={href} className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    img({ src, alt }) {
      const srcStr = typeof src === "string" ? src : "";
      const imgSrc = srcStr.startsWith("/api/")
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}${srcStr}`
        : srcStr;
      return (
        <div className="my-3">
          <img
            src={imgSrc}
            alt={alt || "Generated image"}
            className="rounded-xl max-w-full max-h-[400px] object-contain border border-white/10"
            loading="lazy"
          />
        </div>
      );
    },
  };

  return (
    <div className={`flex gap-4 items-start max-w-[90%] ${showHeader ? "mb-6" : "mb-6 ml-14"}`}>
      {showHeader && (
        <div className="relative shrink-0 mt-1">
          <div
            className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center text-white font-semibold ring-2 ring-indigo-500/20"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a78bfa)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={assistantName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base">{assistantName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0b1020]" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {showHeader && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-white">{assistantName}</span>
            <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-400/70 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              <SparklesIcon size={10} />
              AI
            </span>
          </div>
        )}

        <div className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4 ${showHeader ? "rounded-tl-sm" : ""}`}>
          <div className="text-[13.5px] text-white/[0.85] leading-[1.75]">
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
          </div>
          {sourceFiles && sourceFiles.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-400/70">
              <span className="bg-indigo-500/10 px-2 py-0.5 rounded-full">
                Based on: {sourceFiles.join(", ")}
              </span>
            </div>
          )}
          {pdfAttachment && (
            <PdfPreviewCard
              fileName={pdfAttachment.fileName}
              url={pdfAttachment.url}
              pageCount={pdfAttachment.pageCount}
              fileSize={pdfAttachment.fileSize}
            />
          )}
        </div>

        {!isStreaming && content && (
          <div className="flex gap-1 mt-2 ml-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <CopyIcon size={12} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[11px] text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer">
              <RotateCcwIcon size={12} />
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
