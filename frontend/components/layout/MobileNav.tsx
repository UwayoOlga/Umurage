"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    PiggyBank,
    Banknote,
    Menu
} from "lucide-react";

const navItems = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Members", href: "/dashboard/members", icon: Users },
    { label: "Savings", href: "/dashboard/savings", icon: PiggyBank },
    { label: "Loans", href: "/dashboard/loans", icon: Banknote },
    { label: "Menu", href: "/dashboard/menu", icon: Menu },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-2 z-50 flex justify-between items-center pb-safe">
            {navItems.map((item) => {
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
