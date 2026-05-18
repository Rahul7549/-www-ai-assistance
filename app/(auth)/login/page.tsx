import React from 'react';
import { Bot, MessageSquare, Zap, Mic, Database } from 'lucide-react';

const LoginPage = () => {
    return (
        <main className="flex flex-col lg:flex-row gap-6 w-full min-h-screen p-4 md:p-[30px] bg-[#020617] text-white font-sans">
            {/* Left Section: Hero/Marketing */}
            <section className="flex-1 rounded-3xl relative overflow-hidden flex flex-col justify-between p-8 md:p-12 bg-gradient-to-br from-indigo-900/20 to-transparent border border-white/10 min-h-[500px]">
                <div className="z-10">
                    <h1 className="text-5xl font-bold leading-tight mb-4">
                        Your AI Assistant. <br />
                        <span className="text-indigo-400">Your Universe.</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-xs">
                        Create, Connect, Conquer. The future of productivity is conversational.
                    </p>
                </div>

                {/* Center Robot Image Placeholder */}
                <div className="flex items-center justify-center my-8 lg:absolute lg:inset-0 pointer-events-none">
                    {/* Center Robot Icon with Glow Effect */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative group">

                            {/* 1. Outer Orbiting Ring */}
                            <div className="absolute -inset-10 border border-indigo-500/20 rounded-full animate-[spin_15s_linear_infinite]" />

                            {/* 2. Inner Pulsing Glow */}
                            <div className="absolute inset-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-[100px] animate-pulse" />

                            {/* 3. Floating Robot Icon */}
                            <div className="relative z-10 animate-[bounce_4s_ease-in-out_infinite]">
                                <Bot
                                    size={180}
                                    className="text-indigo-400 drop-shadow-[0_0_25px_rgba(129,140,248,0.8)] transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>

                            {/* 4. Orbital Particles (Optional) */}
                            <div className="absolute top-0 left-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                        </div>
                    </div>




                    {/* Feature Grid with Icons */}

                    <div className="w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-2 gap-4 z-10">
                    {[
                        { title: 'Smart Conversations', desc: 'Powered by advanced AI', icon: <MessageSquare size={18} className="text-indigo-400" /> },
                        { title: 'Your Knowledge', desc: 'Connected & secure', icon: <Database size={18} className="text-purple-400" /> },
                        { title: 'Voice Interaction', desc: 'Speak naturally', icon: <Mic size={18} className="text-indigo-400" /> },
                        { title: 'Real Actions', desc: 'Get things done', icon: <Zap size={18} className="text-blue-400" /> }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm flex items-start gap-3">
                            <div className="p-2 bg-white/5 rounded-lg">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-[13px]">{item.title}</h3>
                                <p className="text-[11px] text-gray-500 leading-tight">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Right Section: Login Form */}
            <section className="flex-1 flex flex-col items-center justify-center p-12 bg-black/20 rounded-3xl border border-white/5">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg rotate-45" />
                        <span className="text-2xl font-bold tracking-tight">AuraAI</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold mb-2">Welcome back</h2>
                        <p className="text-gray-500">Log in to continue to your account</p>
                    </div>

                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Email address</label>
                            <input
                                type="email"
                                placeholder="rahul.kumar@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm text-gray-400">Password</label>
                                <a href="#" className="text-sm text-indigo-400 hover:underline">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all">
                            Log in
                        </button>
                    </form>

                    <div className="relative my-8 text-center">
                        <hr className="border-white/10" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#020617] px-4 text-xs text-gray-500 uppercase tracking-widest">
                            or continue with
                        </span>
                    </div>

                    {/* Social Buttons */}
                    <div className="flex gap-4 mb-8">
                        {['Google', 'GitHub', 'Apple'].map((platform) => (
                            <button key={platform} className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-2 rounded-xl hover:bg-white/10 transition-colors">
                                <span className="text-sm font-medium">{platform}</span>
                            </button>
                        ))}
                    </div>

                    <p className="text-center text-gray-400">
                        Don't have an account? <a href="#" className="text-indigo-400 hover:underline">Create one</a>
                    </p>
                </div>
            </section>
        </main>
    );
};

export default LoginPage;
