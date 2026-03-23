"use client";
import React from 'react';
import { Activity, Search, ShieldAlert, CheckCircle2, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AuditLogsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Security & Audit Logs</h2>
                    <p className="text-sm text-slate-500">Immutable trail of administrative operations.</p>
                </div>
            </div>

            <Card className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                        <input type="text" placeholder="Search event IDs or actors..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900" />
                    </div>
                </div>

                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white border-b border-slate-100 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Timestamp</th>
                            <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Event ID</th>
                            <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Action</th>
                            <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Actor</th>
                            <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 relative bg-white">
                        <tr className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 text-slate-500 font-mono">2026-03-22 18:27:13</td>
                            <td className="px-6 py-4 font-mono text-emerald-600 flex items-center gap-2">USR_AUTH_01 <Copy className="w-3 h-3 text-slate-300" /></td>
                            <td className="px-6 py-4 text-slate-800 font-medium tracking-tight">Admin Invitation Created</td>
                            <td className="px-6 py-4 text-slate-600">system (Root)</td>
                            <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Success</span></td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 text-slate-500 font-mono">2026-03-22 20:41:00</td>
                            <td className="px-6 py-4 font-mono text-emerald-600 flex items-center gap-2">SYS_CFG_09 <Copy className="w-3 h-3 text-slate-300" /></td>
                            <td className="px-6 py-4 text-slate-800 font-medium tracking-tight">Updated Environment Variables</td>
                            <td className="px-6 py-4 text-slate-600">system (Root)</td>
                            <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700"><ShieldAlert className="w-3.5 h-3.5" /> Critical</span></td>
                        </tr>
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
