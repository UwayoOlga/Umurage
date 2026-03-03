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
    Menu
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const navItems = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Members", href: "/dashboard/members", icon: Users },
    { label: "Meetings", href: "/dashboard/meetings", icon: Calendar },
    { label: "Savings", href: "/dashboard/savings", icon: PiggyBank },
    { label: "Loans", href: "/dashboard/loans", icon: Banknote },
];

const adminNavItems = [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
    { label: "Groups", href: "/dashboard/admin/groups", icon: Menu },
];

export function MobileNav() {
    const pathname = usePathname();
    const { isAdmin } = useAuth();

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
