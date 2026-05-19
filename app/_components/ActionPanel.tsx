export default function ActionPanel() {
  const tools = [
    { name: "Search Web", icon: "🌐" },
    { name: "YouTube", icon: "🎥" },
    { name: "Summarize", icon: "📄" },
    { name: "Write Email", icon: "✉️" },
  ];

  return (
    <aside className="w-48 p-4 flex flex-col gap-3 border-indigo-300/15 border-indigo-400 rounded-l-md">
      {tools.map((tool) => (
        <button 
          key={tool.name}
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
