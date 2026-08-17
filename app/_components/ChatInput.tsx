"use client";
import { useState, useEffect, useRef } from "react";
import { MicIcon, PaperclipIcon, SendIcon, SquareIcon, Loader2Icon } from "lucide-react";
import FileChip from "./chat/FileChip";
import { api } from "@/app/lib/api";
import { ENDPOINTS } from "@/app/lib/endpoints";

interface UploadedFile {
    id: string;
    file: File;
    preview?: string;
}

interface UploadResponse {
    success: boolean;
    data: { id: string; fileName: string; originalName: string; mimeType: string; size: number; url: string };
}

interface ChatInputProps {
    onMicClick?: () => void;
    onSend: (message: string, fileIds?: string[], fileNames?: string[]) => void;
    onStop?: () => void;
    disabled?: boolean;
    isStreaming?: boolean;
    prefill?: { text: string; key: number };
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation";

export default function ChatInput({ onMicClick, onSend, onStop, disabled, isStreaming, prefill }: ChatInputProps) {
    const [input, setInput] = useState("");
    const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (prefill?.text) {
            setInput(prefill.text);
            inputRef.current?.focus();
        }
    }, [prefill?.key]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newFiles = files.map((file) => {
            const entry: UploadedFile = { id: crypto.randomUUID(), file };
            if (file.type.startsWith("image/")) {
                entry.preview = URL.createObjectURL(file);
            }
            return entry;
        });
        setAttachedFiles((prev) => [...prev, ...newFiles]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (id: string) => {
        setAttachedFiles((prev) => {
            const removed = prev.find((f) => f.id === id);
            if (removed?.preview) URL.revokeObjectURL(removed.preview);
            return prev.filter((f) => f.id !== id);
        });
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if ((!trimmed && attachedFiles.length === 0) || disabled) return;

        let fileIds: string[] | undefined;

        if (attachedFiles.length > 0) {
            setIsUploading(true);
            try {
                const uploadPromises = attachedFiles.map(async (af) => {
                    const formData = new FormData();
                    formData.append("file", af.file);
                    const res = await api.upload<UploadResponse>(ENDPOINTS.files.upload, formData);
                    return res.data.id;
                });
                fileIds = await Promise.all(uploadPromises);
            } catch (err) {
                console.error("File upload failed:", err);
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        const docFileNames = attachedFiles
            .filter((af) => !af.file.type.startsWith("image/"))
            .map((af) => af.file.name);

        onSend(trimmed || "Analyze the attached file(s)", fileIds, docFileNames);
        setInput("");
        attachedFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
        setAttachedFiles([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-6 pt-0">
            <div className="max-w-4xl mx-auto relative">
                {attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 px-1">
                        {attachedFiles.map((af) => (
                            <FileChip
                                key={af.id}
                                name={af.file.name}
                                mimeType={af.file.type}
                                size={af.file.size}
                                preview={af.preview}
                                onRemove={() => removeFile(af.id)}
                            />
                        ))}
                    </div>
                )}
                <div className="relative flex items-center group">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Message Nova..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || isUploading}
                        className="w-full bg-bg-card border border-white/10 rounded-2xl py-4 px-6 pr-32 focus:outline-none focus:border-brand-primary/50 transition-all shadow-2xl disabled:opacity-50"
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_TYPES}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <PaperclipIcon size={20} />
                        </button>
                        <button onClick={onMicClick} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <MicIcon size={20} />
                        </button>
                        {isStreaming ? (
                            <button
                                onClick={onStop}
                                className="bg-red-600 p-2.5 rounded-xl hover:bg-red-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                            >
                                <SquareIcon size={18} className="text-white fill-white" />
                            </button>
                        ) : isUploading ? (
                            <div className="bg-indigo-600/50 p-2.5 rounded-xl">
                                <Loader2Icon size={18} className="text-white animate-spin" />
                            </div>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={disabled || (!input.trim() && attachedFiles.length === 0)}
                                className="bg-indigo-600 p-2.5 rounded-xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <SendIcon size={18} className="text-white" />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-[10px] text-center text-text-dim mt-3">
                    Nova can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    );
}
