"use client";

import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
    className?: string;
    variant?: "ghost" | "outline" | "filled";
}

export function LanguageSwitcher({ className, variant = "outline" }: LanguageSwitcherProps) {
    const { t, language, setLanguage } = useLanguage();

    const languages = [
        { code: "en", label: "English", short: "EN" },
        { code: "rw", label: "Kinyarwanda", short: "RW" },
        { code: "fr", label: "Français", short: "FR" },
    ] as const;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div
                className={cn(
                    "flex items-center gap-1 p-1 rounded-xl transition-all",
                    variant === "outline" && "border border-slate-200 bg-white/50 backdrop-blur-sm",
                    variant === "filled" && "bg-slate-100",
                    variant === "ghost" && "bg-transparent"
                )}
            >
                <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
                {languages.map((l) => (
                    <button
                        key={l.code}
                        onClick={() => setLanguage(l.code)}
                        className={cn(
                            "px-3 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider",
                            language === l.code
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                        )}
                        title={l.label}
                    >
                        {l.short}
                    </button>
                ))}
            </div>
        </div>
    );
}
