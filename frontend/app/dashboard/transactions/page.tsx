"use client";

import {
    History,
    Search,
    Filter,
    Download,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Layers,
    Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { dashboardService } from "@/lib/services/dashboard.service";
import { useAuth } from "@/context/AuthContext";

export default function TransactionsPage() {
    const { logout } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [metrics, setMetrics] = useState({
        totalSavings: 0,
        totalLoans: 0,
        netBalance: 0
    });

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const result = await dashboardService.getTransactions();
                const txns = result.data || [];
                setTransactions(txns);

                // Calculate Ledger Metrics
                let savings = 0;
                let loans = 0;
                txns.forEach((t: any) => {
                    if (t.status === 'completed') {
                        if (t.type === 'contribution') {
                            savings += t.amount;
                        } else if (t.type === 'loan_disbursement') {
                            loans += t.amount;
                        }
                    }
                });

                setMetrics({
                    totalSavings: savings,
                    totalLoans: loans,
                    netBalance: savings - loans // simplistic view of net standing
                });

            } catch (error: any) {
                if (error.message && error.message.toLowerCase().includes('token')) {
                    logout();
                } else {
                    console.log("Error fetching transactions:", error);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const filteredTxns = transactions.filter(t =>
        (t.group_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (t.from_member_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (t.to_member_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (t.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(amount).replace('RWF', '').trim() + ' RWF';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Layers className="w-8 h-8 text-emerald-600 drop-shadow-sm" />
                        The Ledger
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">A consolidated view of your financial history across all communities.</p>
                </div>
                <button className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 text-slate-700 text-sm font-semibold flex items-center gap-2 transition-all active:scale-95">
                    <Download className="w-4 h-4" />
                    Export Ledger
                </button>
            </div>

            {/* Ledger Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 border-0 shadow-lg shadow-emerald-900/20 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 opacity-10 transform scale-150 group-hover:scale-110 transition-transform duration-700">
                        <Wallet className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex items-center gap-2 text-emerald-100 font-medium mb-4 text-sm tracking-wide uppercase">
                            <Activity className="w-4 h-4" />
                            Net Balance
                        </div>
                        <div>
                            <p className="text-4xl font-extrabold tracking-tight mb-1">
                                {loading ? "..." : formatCurrency(metrics.netBalance)}
                            </p>
                            <p className="text-emerald-100/80 text-sm">Combined standing</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-white p-6 shadow-sm border border-slate-200/60 hover:border-blue-500/30 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Savings</p>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <ArrowDownLeft className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900">
                            {loading ? "..." : formatCurrency(metrics.totalSavings)}
                        </p>
                        <p className="text-sm font-medium text-blue-600 mt-1">Across all communities</p>
                    </div>
                </Card>

                <Card className="bg-white p-6 shadow-sm border border-slate-200/60 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Loans</p>
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900">
                            {loading ? "..." : formatCurrency(metrics.totalLoans)}
                        </p>
                        <p className="text-sm font-medium text-amber-600 mt-1">Currently outstanding</p>
                    </div>
                </Card>
            </div>

            {/* Transactions Log */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Timeline</h2>
                </div>

                {/* Search & Filter Bar */}
                <Card className="p-1.5 bg-white border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by community, member, or ID..."
                                className="w-full pl-11 pr-4 py-2.5 rounded-lg focus:outline-none text-slate-700 bg-transparent placeholder-slate-400 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                        <button className="px-4 py-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors">
                            <Filter className="w-4 h-4" />
                            <span className="hidden sm:inline">Filter Records</span>
                        </button>
                    </div>
                </Card>

                {/* Table */}
                <Card className="overflow-hidden border-slate-200/60 shadow-sm rounded-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Community</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Reference</th>
                                    <th className="px-6 py-4 font-semibold">Member</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">Loading ledger data...</td></tr>
                                ) : filteredTxns.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">No ledger records found</td></tr>
                                ) : (
                                    filteredTxns.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {tx.group_name || 'System Wide'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider",
                                                    tx.type === 'contribution' ? "bg-emerald-50 text-emerald-700" :
                                                        tx.type === 'loan_disbursement' ? "bg-amber-50 text-amber-700" :
                                                            "bg-slate-100 text-slate-700"
                                                )}>
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
                                                {tx.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {tx.from_member_name || tx.to_member_name || 'System'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                {new Date(tx.created_at).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </td>
                                            <td className={cn("px-6 py-4 font-bold tracking-tight",
                                                tx.amount > 0 ? "text-emerald-600" : "text-slate-800"
                                            )}>
                                                {formatCurrency(tx.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
                                                    tx.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                                                        "bg-amber-50 text-amber-600"
                                                )}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
