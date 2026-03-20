"use client";

import { useState, useEffect } from "react";
import {
    Settings, User, Bell, Shield, Moon, LogOut,
    ChevronRight, Globe, ShieldCheck, CheckCircle2, Loader2, MapPin
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function SettingsPage() {
    const { user, logout, changePassword } = useAuth();

    // Password change state
    const [passwords, setPasswords] = useState({ current: '', new: '' });
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordResult, setPasswordResult] = useState<{ success: boolean; message: string } | null>(null);

    // Staff ID claim state
    const [staffId, setStaffId] = useState('');
    const [claiming, setClaiming] = useState(false);
    const [claimResult, setClaimResult] = useState<{ success: boolean; message: string } | null>(null);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setProfile(data.data.user);
            } catch { }
        };
        fetchProfile();
    }, [claimResult]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangingPassword(true);
        setPasswordResult(null);
        try {
            const message = await changePassword(passwords.current, passwords.new);
            setPasswordResult({ success: true, message });
            setPasswords({ current: '', new: '' });
        } catch (error: any) {
            setPasswordResult({ success: false, message: error.message || 'Failed to change password.' });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleClaimStaffId = async (e: React.FormEvent) => {
        e.preventDefault();
        setClaiming(true);
        setClaimResult(null);
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_URL}/auth/claim-staff-id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ staffId: staffId.trim().toUpperCase() }),
            });
            const data = await res.json();
            setClaimResult({ success: data.success, message: data.message });
            if (data.success) setStaffId('');
        } catch {
            setClaimResult({ success: false, message: 'Network error. Please try again.' });
        } finally {
            setClaiming(false);
        }
    };

    const displayName = profile?.name || user?.name || '??';
    const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    const hasStaffAccess = profile?.admin_level && profile.admin_level !== 'none';

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-slate-600" />
                    Settings
                </h1>
                <p className="text-slate-500 text-sm mt-1">Manage your account and credentials.</p>
            </div>

            {/* Profile Section */}
            <Card className="p-6 flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700 shrink-0">
                    {initials}
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
                    <p className="text-slate-500 text-sm">{profile?.phone || user?.phone}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100 capitalize">
                            {profile?.role || 'member'}
                        </span>
                        {hasStaffAccess && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium border border-emerald-100 capitalize flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {profile.admin_level} Admin
                                {profile.managed_location && ` · ${profile.managed_location}`}
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            {/* Security Section (Change Password) */}
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-3">
                    Security
                </h3>
                <Card className="p-6">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                                <Shield className="w-4 h-4" />
                            </div>
                            <h4 className="font-bold text-slate-900">Change Password</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 ml-1 italic">CURRENT PASSWORD</label>
                                <input
                                    type="password"
                                    value={passwords.current}
                                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 ml-1 italic">NEW PASSWORD</label>
                                <input
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                    placeholder="New secure password"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={changingPassword || !passwords.current || !passwords.new}
                                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm disabled:opacity-50 hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                                {changingPassword && <Loader2 className="w-3 h-3 animate-spin" />}
                                Update Password
                            </button>
                        </div>

                        {passwordResult && (
                            <div className={`p-3 rounded-lg text-xs font-medium ${passwordResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {passwordResult.message}
                            </div>
                        )}
                    </form>
                </Card>
            </div>

            {/* Staff Credential Section */}
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-3">
                    SACCO / RCA Staff Credentials
                </h3>
                <Card className="p-6">
                    {hasStaffAccess ? (
                        /* Already verified */
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Credential Verified</p>
                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {profile.admin_level} level access
                                    {profile.managed_location && ` · ${profile.managed_location}`}
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Not yet verified */
                        <form onSubmit={handleClaimStaffId} className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Are you a SACCO or RCA Officer?</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Enter your official Staff ID to unlock oversight access for your jurisdiction.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={staffId}
                                    onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                                    placeholder="e.g. SAC-KGL-001"
                                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase tracking-wider"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={claiming || !staffId}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {claiming ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                                    Verify
                                </button>
                            </div>

                            {claimResult && (
                                <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${claimResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {claimResult.success
                                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        : <Shield className="w-4 h-4 shrink-0" />
                                    }
                                    {claimResult.message}
                                </div>
                            )}
                        </form>
                    )}
                </Card>
            </div>

            {/* App Settings */}
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-3">App Settings</h3>
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
                                <p className="text-xs text-slate-500">English / Kinyarwanda</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                </Card>
            </div>

            {/* Logout */}
            <div className="pt-2">
                <button
                    onClick={logout}
                    className="w-full py-3 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">Umurage v1.0.0</p>
            </div>
        </div>
    );
}
