"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    PiggyBank,
    Banknote,
    Calendar,
    Menu,
    Layers
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export function MobileNav() {
    const pathname = usePathname();
    const { isAdmin } = useAuth();
    const { t } = useLanguage();

    const navItems = [
        { label: t('common.dashboard'), href: "/dashboard", icon: LayoutDashboard },
        { label: t('common.communities'), href: "/dashboard/communities", icon: Layers },

        { label: t('common.savings'), href: "/dashboard/savings", icon: PiggyBank },
        { label: t('common.loans'), href: "/dashboard/loans", icon: Banknote },
    ];

    const adminNavItems = [
        { label: t('common.dashboard'), href: "/dashboard/admin", icon: LayoutDashboard },
        { label: t('common.communities'), href: "/dashboard/admin/groups", icon: Layers },
        { label: t('common.members'), href: "/dashboard/admin/users", icon: Users },
    ];

    const items = isAdmin && isAdmin() ? adminNavItems : navItems;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-2 z-50 flex justify-between items-center pb-safe">
            {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                            isActive ? "text-emerald-600" : "text-slate-400"
                        )}
                    >
                        <item.icon className={cn("w-6 h-6", isActive && "fill-current/10")} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
