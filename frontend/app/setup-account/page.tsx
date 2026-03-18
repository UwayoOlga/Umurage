"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, ArrowRight, Lock, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';

export default function SetupAccountPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setupAccount, loading: authLoading } = useAuth();

    const [setupToken, setSetupToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setSetupToken(tokenFromUrl.toUpperCase());
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await setupAccount(setupToken, password);
            setSuccess(true);
            // Redirection is handled by the success state or AuthContext if it logs in immediately
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to setup account. Please check your token.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-100/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-[450px] space-y-8 relative z-10">
                {/* Logo & Brand */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm bg-white border border-slate-100 p-1">
                            <Image src="/favicon.ico" alt="Umurage Logo" width={32} height={32} className="object-cover" />
                        </div>
                        <span className="text-2xl font-black bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent tracking-tighter">
                            Umurage
                        </span>
                    </div>
                </div>

                <Card className="p-8 shadow-2xl shadow-slate-200/50 border-white/50 backdrop-blur-sm bg-white/90 rounded-2xl">
                    {success ? (
                        <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900">Account Ready!</h2>
                                <p className="text-slate-500">Your password has been set and your account is now active. Redirecting you to your dashboard...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 border-b border-slate-100 pb-6 mb-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Setup Admin Account</h2>
                                <p className="text-slate-500 text-sm">Enter your invitation token and set a secure password.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                        <p className="text-rose-600 text-xs font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Setup Token</label>
                                    <div className="relative">
                                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            required
                                            type="text"
                                            placeholder="SETUP-XXXX-XXXX"
                                            value={setupToken}
                                            onChange={(e) => setSetupToken(e.target.value.toUpperCase())}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono tracking-wider text-slate-700 transition-all focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Create Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            required
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            required
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Complete Setup <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Secure Enterprise Enrollment System</span>
                    </div>
                </Card>

                <div className="text-center">
                    <Link href="/login" className="text-slate-400 hover:text-emerald-600 text-sm font-medium transition-colors">
                        Already have an active account? Sign In
                    </Link>
                </div>
            </div>

            <footer className="absolute bottom-8 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                Umurage Digital Solutions • Security First
            </footer>
        </div>
    );
}
