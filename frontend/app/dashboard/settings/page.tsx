"use client";

import {
    Settings,
    User,
    Bell,
    Shield,
    Moon,
    LogOut,
    ChevronRight,
    Globe
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function SettingsPage() {
    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-slate-600" />
                    Settings
                </h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account and preferences.</p>
            </div>

            {/* Profile Section */}
            <Card className="p-6 flex items-center gap-6">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-emerald-100 ring-4 ring-white shadow-sm">
                    {/* Placeholder for user avatar or typical first letter */}
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-emerald-600">
                        JU
                    </div>
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-900">Jean Uwimana</h2>
                    <p className="text-slate-500 text-sm">jean.uw@example.com</p>
                    <div className="mt-2 flex gap-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                            Admin
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium border border-emerald-100">
                            Verified
                        </span>
                    </div>
                </div>
                <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition">
                    Edit Profile
                </button>
            </Card>

            {/* Settings Sections */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1">App Settings</h3>

                <Card className="divide-y divide-slate-100 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Bell className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Notifications</p>
                                <p className="text-xs text-slate-500">Manage push & SMS alerts</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Globe className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Language</p>
                                <p className="text-xs text-slate-500">English (System default)</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                <Moon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Dark Mode</p>
                                <p className="text-xs text-slate-500">Adjust appearance</p>
                            </div>
                        </div>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 cursor-pointer">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition shadow translate-x-1" />
                        </div>
                    </div>
                </Card>

                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1 mt-6">Security</h3>

                <Card className="divide-y divide-slate-100 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Shield className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Login & Security</p>
                                <p className="text-xs text-slate-500">Change password, 2FA</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                </Card>

                <div className="pt-4">
                    <button className="w-full py-3 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">
                        Umurage App v1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}
