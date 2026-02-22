"use client";

import { useState } from "react";
import {
    PiggyBank,
    Wallet,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    Calendar,
    Filter
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock Data
const SAVINGS_HISTORY = [
    { id: 1, type: "Deposit", member: "Jean Uwimana", amount: "+50,000 RWF", date: "Today, 10:00 AM", method: "Mobile Money", status: "Completed" },
    { id: 2, type: "Deposit", member: "Marie Mukamana", amount: "+20,000 RWF", date: "Today, 09:15 AM", method: "Cash", status: "Completed" },
    { id: 3, type: "Withdrawal", member: "Group Admin", amount: "-150,000 RWF", date: "Yesterday, 4:00 PM", method: "Bank Transfer", status: "Pending" },
    { id: 4, type: "Interest", member: "System", amount: "+2,400 RWF", date: "Feb 1, 2026", method: "Automatic", status: "Completed" },
    { id: 5, type: "Deposit", member: "Alice Uwase", amount: "+30,000 RWF", date: "Jan 28, 2026", method: "Mobile Money", status: "Completed" },
];

export default function SavingsPage() {
    const [filter, setFilter] = useState("All");

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <PiggyBank className="w-6 h-6 text-emerald-600" />
                        Group Savings
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Track contributions and group wealth.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        History
                    </button>
                    <button className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Record Deposit</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Group Savings"
                    value="RWF 2,450,000"
                    icon={Wallet}
                    trend="+12% this month"
                    trendUp={true}
                />
                <StatCard
                    label="My Contributions"
                    value="RWF 350,000"
                    icon={PiggyBank}
                    color="text-blue-600"
                    trend="Last deposit: 2 days ago"
                />
                <StatCard
                    label="Interest Earned"
                    value="RWF 45,200"
                    icon={TrendingUp}
                    color="text-purple-600"
                    trend="+5.2% APY"
                    trendUp={true}
                />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Transaction Legend/Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-emerald-900 rounded-2xl p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <PiggyBank className="w-32 h-32" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Savings Goal</h3>
                        <div className="mb-4 relative z-10">
                            <div className="flex justify-between text-sm mb-1 text-emerald-100">
                                <span>Progress</span>
                                <span>49%</span>
                            </div>
                            <div className="w-full bg-emerald-800 rounded-full h-2">
                                <div className="bg-emerald-400 h-2 rounded-full w-[49%]"></div>
                            </div>
                        </div>
                        <p className="text-emerald-100 text-sm mb-4 relative z-10">
                            Target: <span className="font-bold text-white">5,000,000 RWF</span> by Dec 2026
                        </p>
                    </div>

                    <Card className="p-4">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">Filter Transactions</h3>
                        <div className="space-y-2">
                            {['All', 'Deposits', 'Withdrawals', 'Interest'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center group",
                                        filter === type ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
                                    )}
                                >
                                    {type}
                                    {filter === type && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Transactions List */}
                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden min-h-[500px]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-900">Recent Activity</h2>
                            <button className="text-slate-400 hover:text-slate-600">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {SAVINGS_HISTORY.map((tx) => (
                                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-full", tx.amount.startsWith('+') ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600")}>
                                            {tx.amount.startsWith('+') ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{tx.type} <span className="text-slate-400 font-normal">by</span> {tx.member}</p>
                                            <p className="text-xs text-slate-500">{tx.date} • {tx.method}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("font-bold", tx.amount.startsWith('+') ? "text-emerald-700" : "text-slate-700")}>
                                            {tx.amount}
                                        </p>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider",
                                            tx.status === 'Completed' ? "bg-emerald-50 text-emerald-600" :
                                                tx.status === 'Pending' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
