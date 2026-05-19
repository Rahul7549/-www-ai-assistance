import { CopyIcon , RotateCcw as RotateIcon} from "lucide-react";

export function Message({ role, content }: { role: 'user' | 'assistant', content: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[80%] p-4 rounded-2xl ${
        isUser ? 'bg-brand-primary rounded-tr-none' : 'bg-bg-card rounded-tl-none border border-white/5'
      }`}>
        <p className="text-sm leading-relaxed">{content}</p>
        {!isUser && (
          <div className="flex gap-3 mt-3 border-t border-white/5 pt-2 opacity-50">
             <CopyIcon size={14} className="cursor-pointer hover:text-white" />
             <RotateIcon size={14} className="cursor-pointer hover:text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
