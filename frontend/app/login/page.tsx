"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Phone, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login, user } = useAuth();
    const { t } = useLanguage();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!phone.trim() || !password.trim()) {
            setError(t('auth.no_account'));
            return;
        }

        setLoading(true);
        try {
            const message = await login(phone.trim(), password);
            setSuccess(message);

            setTimeout(() => {
                const searchParams = new URLSearchParams(window.location.search);
                const redirectTo = searchParams.get('redirect') || '/dashboard';
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
            {/* Language Switcher - Fixed Top Right for constant visibility */}
            <div className="fixed top-6 right-6 z-50">
                <LanguageSwitcher className="bg-white/10 backdrop-blur-xl p-1 rounded-2xl border border-white/10" variant="ghost" />
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md animate-in fade-in zoom-in duration-500">
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Back Link */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs mb-6 group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                        {t('auth.back_to_dashboard')}
                    </Link>

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-lg shadow-emerald-500/20 mb-6">
                            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                                <Image src="/favicon.ico" alt="Umurage" width={32} height={32} className="rounded-lg" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">{t('auth.welcome_back')}</h1>
                        <p className="text-slate-400 text-sm mt-3 text-center px-4 leading-relaxed">{t('auth.signin_desc')}</p>
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm animate-in slide-in-from-top-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1">{t('auth.phone')}</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0788..."
                                    className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                                    autoComplete="tel"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1">{t('auth.password')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 py-4 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> {t('auth.signing_in')}</>
                            ) : (
                                <>{t('auth.login')} <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-slate-500 text-xs">{t('auth.no_account')}</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Register link */}
                    <Link
                        href="/register"
                        className="block w-full py-3 px-6 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-300 hover:text-white font-medium rounded-xl transition-all text-center"
                    >
                        {t('auth.create_account_btn')}
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-600 text-xs mt-6">
                    © 2026 Umurage Ltd. {t('landing.footer')}
                </p>
            </div>
        </div>
    );
}
