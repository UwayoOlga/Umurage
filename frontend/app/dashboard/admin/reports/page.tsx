"use client";
import React from 'react';
import { FileText, Download, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">National Analytics & Reports</h2>
                    <p className="text-sm text-slate-500">Global RCA Financial Oversight & Compliance (RCA Admin Only).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-l-4 border-l-emerald-500 flex justify-between bg-emerald-50">
                    <div>
                        <p className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1">Total Savings (National)</p>
                        <h3 className="text-3xl font-black text-emerald-900">RWF 420.5M</h3>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-amber-500 flex justify-between bg-amber-50">
                    <div>
                        <p className="text-xs font-semibold text-amber-800 uppercase tracking-widest mb-1">Active Loans Out</p>
                        <h3 className="text-3xl font-black text-amber-900">RWF 145.2M</h3>
                    </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-rose-500 flex justify-between bg-rose-50">
                    <div>
                        <p className="text-xs font-semibold text-rose-800 uppercase tracking-widest mb-1">Total NPL (At Risk)</p>
                        <h3 className="text-3xl font-black text-rose-900">RWF 2.4M</h3>
                    </div>
                </Card>
            </div>

            <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        Quarterly Compliance Reports
                    </h3>
                    <button className="flex items-center gap-2 text-sm font-medium bg-white text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-sm transition">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
                <div className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">Wait for Q1 end to generate structural RCA data.</p>
                </div>
            </div>
        </div>
    );
}
