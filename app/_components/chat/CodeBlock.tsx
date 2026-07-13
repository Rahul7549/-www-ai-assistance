"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ClipboardIcon, CheckIcon } from "lucide-react";

interface CodeBlockProps {
  language: string;
  children: string;
}

export default function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl border border-white/[0.08] overflow-hidden bg-black/35">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.06]">
        <span className="text-[11px] font-medium font-mono text-white/35">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-white/30 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] hover:text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <CheckIcon size={12} />
              Copied!
            </>
          ) : (
            <>
              <ClipboardIcon size={12} />
              Copy code
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "16px",
          background: "transparent",
          fontSize: "12.5px",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: { fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace" },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
