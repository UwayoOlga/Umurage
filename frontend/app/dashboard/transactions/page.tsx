import {
    History,
    Search,
    Filter,
    ArrowDownLeft,
    ArrowUpRight,
    Download
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { dashboardService } from "@/lib/services/dashboard.service";

export default function TransactionsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const result = await dashboardService.getTransactions();
                setTransactions(result.data);
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const filteredTxns = transactions.filter(t =>
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
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-6 h-6 text-emerald-600" />
                        Transactions
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Audit log of all financial activities.</p>
                </div>
                <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-sm font-medium flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Search & Filter Bar */}
            <Card className="p-1">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by member or reference ID..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-[1px] bg-slate-100"></div>
                    <button className="px-4 py-2 text-slate-500 hover:text-emerald-600 flex items-center gap-2 text-sm font-medium">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </Card>

            {/* Transactions Table */}
            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Reference</th>
                                <th className="px-6 py-4 font-medium">Member</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading transactions...</td></tr>
                            ) : filteredTxns.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">No transactions found</td></tr>
                            ) : (
                                filteredTxns.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-900 capitalize">{tx.type.replace('_', ' ')}</span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                            {tx.id.substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {tx.from_member_name || tx.to_member_name || 'System'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </td>
                                        <td className={cn("px-6 py-4 font-bold",
                                            tx.amount > 0 ? "text-emerald-700" : "text-slate-700"
                                        )}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                tx.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    "bg-amber-50 text-amber-700 border-amber-100"
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
    );
}
