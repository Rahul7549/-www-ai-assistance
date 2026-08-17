interface ActionPanelProps {
  onAction?: (prompt: string) => void;
}

const tools = [
  { name: "Compose", icon: "✍️", prompt: "Draft a professional email " },
  { name: "Research", icon: "🔍", prompt: "Research and provide a detailed analysis on: " },
  { name: "Summarize", icon: "📋", prompt: "Summarize the following content clearly and concisely:\n\n" },
  { name: "Brainstorm", icon: "💡", prompt: "Brainstorm creative ideas for: " },
];

export default function ActionPanel({ onAction }: ActionPanelProps) {
  return (
    <aside className="w-48 p-4 flex flex-col gap-3 border-indigo-300/15 border-indigo-400 rounded-l-md">
      {tools.map((tool) => (
        <button
          key={tool.name}
          onClick={() => onAction?.(tool.prompt)}
          className="flex items-center gap-3 p-3 rounded-xl bg-bg-card hover:bg-white/5 border border-white/5 transition-all text-sm group"
        >
          <span className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-primary/20 transition-colors">
            {tool.icon}
          </span>
          {tool.name}
        </button>
      ))}
      <button className="text-text-dim text-xs mt-2 hover:text-white">... More Tools</button>
    </aside>
  );
}
