"use client";
import React from 'react';
import { Server, Database, Shield, Activity, RefreshCw } from 'lucide-react';

export default function SystemConfigPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Configuration</h2>
                    <p className="text-sm text-slate-500">Manage low-level application parameters (System Admin Only).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Database Ops */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Database className="w-5 h-5" /></div>
                        <h3 className="font-semibold text-slate-900">Database Tools</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Manage manual backups, optimization, and migration states.</p>
                    <button className="text-sm font-medium bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition">Run Manual Backup</button>
                </div>

                {/* API Gateways */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Server className="w-5 h-5" /></div>
                        <h3 className="font-semibold text-slate-900">External Integrations</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">Status of MTN MoMo, Airtel Money, and Africa's Talking Gateways.</p>
                    <button className="text-sm font-medium border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Sync Gateways</button>
                </div>
            </div>
        </div>
    );
}
