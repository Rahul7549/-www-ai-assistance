"use client";
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, User, Bot, Mic, Upload } from 'lucide-react';
import { api } from '@/app/lib/api';
import { ENDPOINTS, AVATARS, VOICES } from '@/app/lib/endpoints';
import { useAuth } from '@/app/lib/auth-context';

const PERSONALITIES = [
    { value: 'PROFESSIONAL', label: 'Professional', desc: 'Clear, precise, and formal' },
    { value: 'FRIENDLY', label: 'Friendly', desc: 'Warm, casual, and supportive' },
    { value: 'WITTY', label: 'Witty', desc: 'Clever, engaging, and entertaining' },
    { value: 'CONCISE', label: 'Concise', desc: 'Direct, brief, no filler' },
    { value: 'CREATIVE', label: 'Creative', desc: 'Imaginative and inspiring' },
] as const;

const RegistrationPage = () => {
    const { login } = useAuth();

    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Account details
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Step 2: Avatar
    const [selectedAvatar, setSelectedAvatar] = useState('Nova');
    const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setCustomAvatarPreview(previewUrl);
        setSelectedAvatar('Custom');
    };

    // Step 3: Assistant identity
    const [assistantName, setAssistantName] = useState('Nova');
    const [personality, setPersonality] = useState('FRIENDLY');
    const [voice, setVoice] = useState<string>(VOICES[0]);

    const steps = [
        { id: 1, title: 'Account', icon: <User size={18} />, desc: 'Create your account' },
        { id: 2, title: 'Avatar', icon: <Bot size={18} />, desc: 'Choose your assistant' },
        { id: 3, title: 'Identity', icon: <Mic size={18} />, desc: 'Personality and voice' },
    ];

    const validateStep = (): boolean => {
        setError('');
        if (step === 1) {
            if (!firstName.trim() || !lastName.trim()) { setError('First name and last name are required'); return false; }
            if (!email.trim()) { setError('Email is required'); return false; }
            if (password.length < 8) { setError('Password must be at least 8 characters'); return false; }
            if (password !== confirmPassword) { setError('Passwords do not match'); return false; }
        }
        if (step === 3) {
            if (!assistantName.trim()) { setError('Assistant name is required'); return false; }
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        setStep(s => Math.min(3, s + 1));
    };

    const handleBack = () => {
        setError('');
        setStep(s => Math.max(1, s - 1));
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;
        setError('');
        setLoading(true);

        try {
            // 1. Register account
            await api.post(ENDPOINTS.auth.register, { firstName, lastName, email, password });

            // 2. Login to get JWT tokens
            await login(email, password);

            // 3. Create the assistant (token is now in localStorage)
            await api.post(ENDPOINTS.assistants.create, {
                name: assistantName,
                avatar: selectedAvatar,
                personality,
                voiceId: voice,
            });

            // login() already redirects to /
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-[#020617] text-white">

            {/* --- LEFT SIDEBAR (Hidden on Mobile) --- */}
            <aside className="hidden lg:flex w-80 bg-[#0b1120]/50 border-r border-white/5 flex-col p-10 shrink-0 shadow-2xl">
                <div className="mb-12 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(79,70,229,0.4)]" />
                    <span className="font-bold text-xl tracking-tight">AuraAI</span>
                </div>

                <nav className="space-y-4 flex-1">
                    {steps.map((s, index) => {
                        const isActive = step === s.id;
                        const isCompleted = step > s.id;
                        return (
                            <div key={s.id} className="relative">
                                {index !== steps.length - 1 && (
                                    <div className="absolute left-[23px] top-12 w-[2px] h-8 bg-white/5" />
                                )}
                                <button className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${isActive ? 'bg-white/[0.03] border border-white/5' : 'opacity-40'}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isActive ? 'bg-indigo-600 border-indigo-400' : isCompleted ? 'bg-green-600 border-green-400' : 'bg-white/5 border-white/5'}`}>
                                        {isCompleted ? <Check size={18} /> : <span className="text-sm font-bold">{s.id}</span>}
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-bold">{s.title}</h4>
                                        <p className="text-[11px] text-gray-500 leading-tight">{s.desc}</p>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <section className='flex-1 flex flex-col p-6 md:p-12 lg:p-20 overflow-y-auto'>

                <div className="max-w-2xl lg:max-w-none mb-10">
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                        Your AI Assistant. <span className="text-indigo-400">Your Universe.</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-lg">
                        Create, Connect, Conquer. The future of productivity is conversational.
                    </p>
                </div>

                <div className="w-full max-w-4xl md:max-w-none bg-[#0b1120] rounded-[32px] border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-6 md:p-12 flex-1">

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                                {error}
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="st1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <h2 className="text-2xl md:text-3xl font-bold">Create Account</h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputField label="First Name" placeholder="Rahul" value={firstName} onChange={setFirstName} />
                                            <InputField label="Last Name" placeholder="Kumar" value={lastName} onChange={setLastName} />
                                        </div>
                                        <InputField label="Email" placeholder="rahul@example.com" type="email" value={email} onChange={setEmail} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputField label="Password" placeholder="••••••••" type="password" value={password} onChange={setPassword} />
                                            <InputField label="Confirm Password" placeholder="••••••••" type="password" value={confirmPassword} onChange={setConfirmPassword} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="st2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <h2 className="text-2xl md:text-3xl font-bold mb-8">Choose Avatar</h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {AVATARS.map((av, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setSelectedAvatar(av.name)}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-4 ${selectedAvatar === av.name ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}
                                            >
                                                <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/40">
                                                    <img src={av.src} alt={av.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest">{av.name}</span>
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-4 ${selectedAvatar === 'Custom' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}
                                        >
                                            <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
                                                {customAvatarPreview ? (
                                                    <img src={customAvatarPreview} alt="Custom" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Upload size={40} className="text-gray-600" />
                                                )}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-widest">Custom</span>
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCustomAvatarUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="st3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">Finalize Identity</h2>
                                        <p className="text-gray-500">Set your assistant&apos;s name, personality, and voice</p>
                                    </div>
                                    <div className="space-y-6">
                                        <InputField label="Assistant Name" placeholder="e.g. Aura" value={assistantName} onChange={setAssistantName} />

                                        <div>
                                            <label className="text-[10px] uppercase tracking-[2px] text-gray-500 mb-3 block font-bold">Personality</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                                {PERSONALITIES.map((p) => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => setPersonality(p.value)}
                                                        className={`p-4 rounded-2xl border text-center transition-all ${personality === p.value ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                                    >
                                                        <span className="text-sm font-bold block mb-1">{p.label}</span>
                                                        <span className="text-[10px] text-gray-500 leading-tight">{p.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] uppercase tracking-[2px] text-gray-500 mb-2 block font-bold">Primary Voice</label>
                                            <select
                                                value={voice}
                                                onChange={(e) => setVoice(e.target.value)}
                                                className="w-full bg-[#0b1120] border border-white/10 p-4 rounded-2xl outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-white"
                                            >
                                                {VOICES.map((v) => (
                                                    <option key={v} value={v} className="bg-[#0b1120] text-white">{v}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="p-6 md:p-10 border-t border-white/5 bg-black/20 flex justify-between gap-4">
                        <button
                            type="button"
                            onClick={handleBack}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-sm font-bold transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        >
                            <ChevronLeft size={18} /> BACK
                        </button>

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold shadow-lg transition-all"
                            >
                                CONTINUE <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-sm font-bold shadow-lg transition-all"
                            >
                                {loading ? 'Creating...' : 'CREATE ASSISTANT'} <ChevronRight size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
};

const InputField = ({ label = '', placeholder = '', type = 'text', value, onChange }: {
    label?: string;
    placeholder?: string;
    type?: string;
    value: string;
    onChange: (val: string) => void;
}) => (
    <div className="w-full">
        <label className="text-[10px] uppercase tracking-[2px] text-gray-500 mb-2 block font-bold">{label}</label>
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-700"
        />
    </div>
);

export default RegistrationPage;
