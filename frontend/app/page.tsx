"use client";

import Link from "next/link";
import Image from "next/image";
import { 
    ArrowRight, 
    CheckCircle2, 
    Shield, 
    Smartphone, 
    Heart, 
    Users, 
    PiggyBank, 
    HandCoins, 
    ArrowUpRight,
    Globe
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { cn } from "@/lib/utils";

export default function LandingPage() {
    const { t, language } = useLanguage();

    return (
        <div className="min-h-screen bg-weave flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
            {/* Navbar */}
            <nav className="glass-panel sticky top-0 z-50 transition-all border-b border-white/40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20 bg-white border border-slate-50 p-1.5 flex items-center justify-center">
                            <Image src="/favicon.ico" alt="Umurage Logo" width={32} height={32} className="object-cover" />
                        </div>
                        <div>
                            <span className="text-2xl font-black bg-gradient-to-r from-emerald-800 to-emerald-600 bg-clip-text text-transparent tracking-tighter block leading-none">
                                Umurage
                            </span>
                            <span className={cn("text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1 block", 
                                language === 'rw' && "text-[9px]")}>
                                {language === 'rw' ? "Izigama Ry'Izere" : "Legacy of Trust"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-8">
                        <div className="hidden md:flex items-center gap-6">
                            <a href="#how-it-works" className="text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors">How it Works</a>
                            <a href="#safety" className="text-sm font-bold text-slate-500 hover:text-emerald-700 transition-colors">Safety</a>
                        </div>
                        
                        <LanguageSwitcher className="scale-90 sm:scale-100" />

                        <div className="flex items-center gap-3 sm:gap-4 ml-2">
                            <Link
                                href="/login"
                                className="hidden sm:block text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors px-4 py-2"
                            >
                                {t('auth.login')}
                            </Link>
                            <Link
                                href="/register"
                                className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black shadow-xl shadow-emerald-900/10 transition-all flex items-center gap-2 text-sm"
                            >
                                {t('auth.register')} <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                {/* Hero section - More natural & Community Focused */}
                <section className="relative pt-12 md:pt-24 pb-32 px-6 overflow-hidden">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                        <div className="text-left relative z-10 space-y-8 animate-in slide-in-from-left duration-700">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-widest">
                                <Smartphone className="w-3 h-3" />
                                {t('landing.hero_badge')}
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tight">
                                {language === 'rw' 
                                    ? <>{t('landing.hero_title')} <span className="text-emerald-600">Cy\'Imigane</span></>
                                    : <>{t('landing.hero_title')} <span className="text-emerald-600">for Everyone.</span></>
                                }
                            </h1>

                            <p className="text-lg md:text-xl text-slate-500 max-w-xl font-medium leading-relaxed">
                                {t('landing.hero_desc')}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                <Link
                                    href="/register"
                                    className="w-full sm:w-auto px-10 py-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-[20px] font-black shadow-2xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-3 text-lg group"
                                >
                                    {t('auth.register')} 
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <div className="flex items-center gap-3 px-6 py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-100">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                    <p className="text-sm font-bold text-slate-600">
                                        <span className="text-emerald-700">1,200+</span> {language === 'rw' ? "Amatsinda yishimye" : "Happy Communities"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Image Side - Warm & Authentic */}
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-100 to-amber-100 rounded-[40px] blur-2xl opacity-50 transition-opacity group-hover:opacity-70" />
                            <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden shadow-2xl border-[12px] border-white transform transition-all duration-500 hover:scale-[1.02] hover:-rotate-1">
                                <Image 
                                    src="/hero-community.png" 
                                    alt="Rwandan Community using Umurage" 
                                    fill 
                                    className="object-cover"
                                    priority
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent" />
                                <div className="absolute bottom-8 left-8 right-8 text-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <Heart className="w-4 h-4 fill-white" />
                                        </div>
                                        <p className="text-sm font-bold tracking-wide italic">"Umurage wasanzwe mu mutima wa buri Munyarwanda."</p>
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-white/70 ml-11">Built by your community, for your future.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Scenarios - Accessible to everyone */}
                <section id="how-it-works" className="py-24 px-6 relative">
                    <div className="max-w-7xl mx-auto text-center mb-16">
                        <p className="text-[12px] font-black uppercase text-emerald-600 tracking-widest mb-4">How it helps you</p>
                        <h2 className="text-4xl font-black text-slate-900">{language === 'rw' ? "Akamaro k\'Umurage" : "What can you do with Umurage?"}</h2>
                    </div>

                    <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: PiggyBank,
                                title: language === 'rw' ? "Bika Neza" : "Safe Contributions",
                                desc: language === 'rw' ? "Bika imisanzu yawe mu itsinda kuri MoMo, ucyemure impaka z\'ibitabo byatakaye." : "Deposit group contributions via MoMo. No more lost books or confusing records.",
                                color: "bg-emerald-50 text-emerald-600",
                                border: "border-emerald-100"
                            },
                            {
                                icon: HandCoins,
                                title: language === 'rw' ? "Inguzanyo z\'Ingoga" : "Quick Loans",
                                desc: language === 'rw' ? "Saba inguzanyo ako kanya nufite ibibazo byihutirwa cyangwa ushaka gushora." : "Apply for group loans in seconds for emergencies, school fees, or starting a small business.",
                                color: "bg-amber-50 text-amber-600",
                                border: "border-amber-100"
                            },
                            {
                                icon: Globe,
                                title: language === 'rw' ? "Ikoranabuhanga ryoroshye" : "Everyone is Included",
                                desc: language === 'rw' ? "Ikoranabuhanga ryubakiye ku mucyo no ku kizere. Buri muntu wese yanditswe neza." : "Built for everyone—from village elders to city students. Transparent history for ultimate trust.",
                                color: "bg-blue-50 text-blue-600",
                                border: "border-blue-100"
                            }
                        ].map((scenario, i) => (
                            <div key={i} className={cn("p-10 rounded-[32px] bg-white border-2 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-slate-200/50", scenario.border)}>
                                <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-8", scenario.color)}>
                                    <scenario.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4">{scenario.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{scenario.desc}</p>
                                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-2 text-emerald-700 font-bold text-sm cursor-pointer hover:gap-3 transition-all">
                                    <span>Learn more</span> <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Safety & Compliance - Building Trust */}
                <section id="safety" className="py-24 px-6 bg-slate-900 text-white relative overflow-hidden rounded-[40px] mx-6 mb-24">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
                    
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-20">
                        <div className="flex-1 space-y-8">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-[28px] border border-emerald-500/30 flex items-center justify-center">
                                <Shield className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black">{language === 'rw' ? "Umutekano nibyo bishyizwe imbere" : "Your Security is our Foundation"}</h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                {language === 'rw' 
                                    ? "Umurage wubahiriza amabwiriza ya BNR na RCA. Amakuru yawe ararinzwe kandi buri faranga rigerwa neza n\'ubufatanye bwa SACCO."
                                    : "Umurage is fully compliant with BNR and RCA audit standards. Your data is encrypted and every transaction is verified through our SACCO integration."
                                }
                            </p>
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div>
                                    <p className="text-3xl font-black text-white">100%</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Data Transparency</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black text-white">RCA</p>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Verified Standard</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-[320px] bg-white/5 backdrop-blur-md rounded-[32px] p-8 border border-white/10 relative group">
                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce duration-[2000ms] shadow-2xl">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-lg font-bold">Why Trust Us?</h4>
                                <ul className="space-y-4">
                                    {[
                                        "Biometric Security",
                                        "Mobile Money Ledger",
                                        "Automatic DRC Backups",
                                        "Village Leader Consensus"
                                    ].map((t, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to action */}
                <section className="py-32 px-6 text-center">
                    <div className="max-w-3xl mx-auto space-y-10">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-10 border border-emerald-200">
                            <ArrowUpRight className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">Ready to grow your community?</h2>
                        <p className="text-xl text-slate-500 font-medium">{language === 'rw' ? "Fatanya natwe wizamure mu buryo bworoshye kandi bwizewe." : "Join thousands of members today. It takes less than 2 minutes to start."}</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto px-12 py-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-[24px] font-black shadow-2xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-3 text-xl"
                            >
                                {t('auth.register')} <ArrowRight className="w-6 h-6" />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white py-16 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                                <Image src="/favicon.ico" alt="Umurage Logo" width={24} height={24} className="object-cover" />
                            </div>
                            <span className="font-black text-2xl text-slate-900 tracking-tighter">Umurage</span>
                        </div>
                        <p className="text-sm font-medium text-slate-400 max-w-[240px] text-center md:text-left leading-relaxed">
                            Empowering Rwandan savings groups through modern digital trust.
                        </p>
                    </div>
                    
                    <div className="flex flex-col items-center md:items-end gap-3">
                        <p className="text-sm font-bold text-slate-900 uppercase tracking-widest text-center md:text-right">Built for Rwanda 🇷🇼</p>
                        <p className="text-xs text-slate-400">© 2026 Umurage Inclusive. All rights reserved.</p>
                        <div className="flex gap-6 mt-4">
                            <a href="#" className="text-xs font-bold text-slate-500 hover:text-emerald-700">Privacy Policy</a>
                            <a href="#" className="text-xs font-bold text-slate-500 hover:text-emerald-700">Terms of Use</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
