"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, User, Bot, Mic, Upload } from 'lucide-react';

const RegistrationPage = () => {
    const [step, setStep] = useState(1);
    const [selectedAvatar, setSelectedAvatar] = useState('Nova');

    const steps = [
        { id: 1, title: 'Avatar', icon: <User size={18} />, desc: 'Choose your assistant' },
        { id: 2, title: 'Identity', icon: <Bot size={18} />, desc: 'Name and greeting' },
        { id: 3, title: 'Personality', icon: <Mic size={18} />, desc: 'How should it behave?' },
    ];

    const avatars = [
        { name: 'Nova', src: 'https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-man-avatar-image-for-profile-png-image_9197908.png' },
        { name: 'Lumen', src: 'https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-man-avatar-image-for-profile-png-image_9197908.png' },
        { name: 'Orion', src: 'https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-man-avatar-image-for-profile-png-image_9197908.png' },
        { name: 'Sage', src: 'https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-man-avatar-image-for-profile-png-image_9197908.png' },
       
        { name: 'Orion', src: 'https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-man-avatar-image-for-profile-png-image_9197908.png' },
        { name: 'Sage', src: 'https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-man-avatar-image-for-profile-png-image_9197908.png' },
        { name: 'Custom', src: null }
    ];

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
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isActive ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/5'}`}>
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
                
                {/* Header Text */}
                <div className="max-w-2xl lg:max-w-none mb-10">
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                        Your AI Assistant. <span className="text-indigo-400">Your Universe.</span>
                    </h1>
                    <p className="text-gray-400 text-sm md:text-lg">
                        Create, Connect, Conquer. The future of productivity is conversational.
                    </p>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-4xl md:max-w-none bg-[#0b1120] rounded-[32px] border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-6 md:p-12 flex-1">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="st1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                    <h2 className="text-2xl md:text-3xl font-bold">Create Account</h2>
                                    <div className="space-y-4">
                                        <InputField label="Full Name" placeholder="Rahul Kumar" />
                                        <InputField label="Email" placeholder="rahul@example.com" type="email" />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <InputField label="Password" placeholder="••••••••" type="password" />
                                            <InputField label="Confirm" placeholder="••••••••" type="password" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="st2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <h2 className="text-2xl md:text-3xl font-bold mb-8">Choose Avatar</h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {avatars.map((av,index) => (
                                            <button 
                                                key={index} 
                                                onClick={() => setSelectedAvatar(av.name)}
                                                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-4 ${selectedAvatar === av.name ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}
                                            >
                                                <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/40">
                                                    {av.src ? <img src={av.src} className="w-full h-full object-cover" /> : <Upload className="m-auto h-full text-gray-600" />}
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest">{av.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="st3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">Finalize Identity</h2>
                                        <p className="text-gray-500">Set your assistant's name and voice</p>
                                    </div>
                                    <div className="space-y-6">
                                        <InputField label="Assistant Name" placeholder="e.g. Aura" />
                                        <div>
                                            <label className="text-[10px] uppercase tracking-[2px] text-gray-500 mb-2 block">Primary Voice</label>
                                            <select className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:ring-1 focus:ring-indigo-500 transition-all">
                                                <option>Nova - Energetic & Fast</option>
                                                <option>Echo - Soft & Calm</option>
                                                <option>Atlas - Deep & Professional</option>
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
                            onClick={() => setStep(s => s - 1)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-sm font-bold transition-all ${step === 1 ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <ChevronLeft size={18} /> BACK
                        </button>
                        <button 
                            onClick={() => setStep(s => Math.min(3, s + 1))}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold shadow-lg transition-all"
                        >
                            CONTINUE <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
};

const InputField = ({ label='', placeholder='', type = "text" }) => (
    <div className="w-full">
        <label className="text-[10px] uppercase tracking-[2px] text-gray-500 mb-2 block font-bold">{label}</label>
        <input 
            type={type} 
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-700"
        />
    </div>
);

export default RegistrationPage;
