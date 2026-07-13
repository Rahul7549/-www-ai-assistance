"use client";

import { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { CopyIcon, RotateCcwIcon } from "lucide-react";
import CodeBlock from "./CodeBlock";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
}

export default function AssistantMessage({ content, isStreaming }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);

  const isError = content.startsWith("Error: ");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
  };

  return (
    <div className="flex gap-3.5 items-start mb-6">
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm text-white font-semibold shrink-0"
        style={{
          background: "linear-gradient(135deg, #6366f1, #a78bfa)",
          boxShadow: "0 2px 8px rgba(99,102,241,0.2)",
        }}
      >
        N
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/40 mb-2 tracking-wide">Nova</p>

        <div className="text-[13.5px] text-white/[0.82] leading-[1.75]">
          <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        </div>

        {!isStreaming && content && (
          <div className="flex gap-1.5 mt-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-[5px] py-[5px] px-3 rounded-lg text-[11px] text-white/30 bg-white/[0.03] border border-white/[0.06] hover:text-white/70 hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <CopyIcon size={13} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="flex items-center gap-[5px] py-[5px] px-3 rounded-lg text-[11px] text-white/30 bg-white/[0.03] border border-white/[0.06] hover:text-white/70 hover:bg-white/[0.06] transition-all cursor-pointer">
              <RotateCcwIcon size={13} />
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
