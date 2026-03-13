"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    PiggyBank,
    Banknote,
    History,
    Settings,
    LogOut,
    Shield,
    Layers,
    Calendar
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Globe } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const { user, isAdmin, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();

    const navItems = [
        { label: t('common.dashboard'), href: "/dashboard", icon: LayoutDashboard },
        { label: t('common.communities'), href: "/dashboard/communities", icon: Layers },
        { label: t('common.meetings'), href: "/dashboard/meetings", icon: Calendar },
        { label: t('common.savings'), href: "/dashboard/savings", icon: PiggyBank },
        { label: t('common.loans'), href: "/dashboard/loans", icon: Banknote },
        { label: t('common.transactions'), href: "/dashboard/transactions", icon: History },
        { label: t('common.settings'), href: "/dashboard/settings", icon: Settings },
    ];

    const adminNavItems = [
        { label: "Admin Dashboard", href: "/dashboard/admin", icon: Shield },
        { label: "User Management", href: "/dashboard/admin/users", icon: Users },
        { label: "Groups Overview", href: "/dashboard/admin/groups", icon: Layers },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-slate-100 fixed left-0 top-0 z-40">
            <div className="p-6 border-b border-slate-50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm group-hover:shadow-emerald-200 transition-all bg-white">
                        <Image src="/favicon.ico" alt="Umurage Logo" width={32} height={32} className="object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent cursor-pointer">
                        Umurage
                    </h1>
                </Link>
                <p className="text-xs text-slate-400 mt-1">Modern Savings Group</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {!isAdmin() && navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
                            {item.label}
                        </Link>
                    );
                })}

                {/* Admin Section */}
                {user && isAdmin() && (
                    <>
                        <div className="pt-4 pb-2">
                            <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Administration
                            </div>
                        </div>
                        {adminNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                                        isActive
                                            ? "bg-purple-50 text-purple-700 shadow-sm"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5", isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-50 space-y-4">
                {/* Language Switcher */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">
                        {t('common.language')}
                    </p>
                    <LanguageSwitcher variant="filled" className="bg-slate-50 rounded-xl p-1" />
                </div>

                {user && (
                    <div className="px-4 py-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.phone}</p>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    {t('common.logout')}
                </button>
            </div>
        </aside>
    );
}
