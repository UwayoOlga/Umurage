"use client";

import { Suspense } from 'react';
import SetupAccountForm from './SetupAccountForm';
import Image from 'next/image';
import Link from 'next/link';

export default function SetupAccountPage() {
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

                <Suspense fallback={
                    <div className="flex items-center justify-center p-12 bg-white rounded-2xl shadow-xl">
                        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                }>
                    <SetupAccountForm />
                </Suspense>

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
