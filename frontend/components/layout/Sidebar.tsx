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
    LogOut
} from "lucide-react";
import Image from "next/image";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Members", href: "/dashboard/members", icon: Users },
    { label: "Savings", href: "/dashboard/savings", icon: PiggyBank },
    { label: "Loans", href: "/dashboard/loans", icon: Banknote },
    { label: "Transactions", href: "/dashboard/transactions", icon: History },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

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

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
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
            </nav>

            <div className="p-4 border-t border-slate-50">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
