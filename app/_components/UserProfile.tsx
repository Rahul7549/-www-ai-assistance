import { SettingsIcon } from "lucide-react";

interface UserProfileProps {
  name: string;
  plan: string;
}

export default function UserProfile({ name, plan }: UserProfileProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 border border-white/10" />
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-none">{name}</span>
          <span className="text-[10px] text-text-dim mt-1">{plan}</span>
        </div>
      </div>
      <button className="text-text-dim hover:text-white transition-colors">
        <SettingsIcon size={16} />
      </button>
    </div>
  );
}
