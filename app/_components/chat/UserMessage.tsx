"use client";

export default function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex w-full justify-end mb-6">
      <div
        className="max-w-[70%] px-[18px] py-3 text-white text-[13.5px] leading-normal"
        style={{
          background: "linear-gradient(135deg, #6366f1, #7c5cff)",
          borderRadius: "20px 20px 6px 20px",
          boxShadow: "0 2px 12px rgba(99,102,241,0.25)",
        }}
      >
        {content}
      </div>
    </div>
  );
}
