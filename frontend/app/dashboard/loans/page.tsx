import {
    Banknote,
    Plus,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    ChevronRight
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { dashboardService } from "@/lib/services/dashboard.service";

export default function LoansPage() {
    const [loans, setLoans] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [loansRes, summaryRes] = await Promise.all([
                    dashboardService.getLoans(),
                    dashboardService.getSummary()
                ]);
                setLoans(loansRes.data);
                setSummary(summaryRes.data);
            } catch (error) {
                console.error("Error fetching loans:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(amount).replace('RWF', '').trim() + ' RWF';
    };

    const activeLoans = loans.filter(l => l.status === 'approved' || l.status === 'disbursed' || l.status === 'pending');
    const loanHistory = loans.filter(l => l.status === 'repaid' || l.status === 'rejected');
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Banknote className="w-6 h-6 text-blue-600" />
                        Loans Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage active loans and meaningful borrowing.</p>
                </div>
                <button className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-200">
                    <Plus className="w-4 h-4" />
                    <span>Request Loan</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Active Loans Balance"
                    value={loading ? "..." : formatCurrency(summary?.activeLoans || 0)}
                    icon={Banknote}
                    color="text-blue-600"
                    trend={loading ? undefined : `${activeLoans.length} active loans`}
                />
                <StatCard
                    label="Expected Repayments"
                    value="RWF 0"
                    icon={Calendar}
                    color="text-emerald-600"
                    trend="Currently no dues"
                    trendUp={true}
                />
                <StatCard
                    label="Default Risk"
                    value="None"
                    icon={AlertCircle}
                    color="text-amber-600"
                    trend="Clean record"
                    trendUp={false}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Active Loans Section */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        Active Loans
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{activeLoans.length}</span>
                    </h2>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Loading loans...</div>
                        ) : activeLoans.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">No active loans</div>
                        ) : (
                            activeLoans.map((loan) => (
                                <Card key={loan.id} className="p-5 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{loan.purpose || 'Personal Loan'}</h3>
                                            <p className="text-slate-500 text-sm">Group: {loan.group_name}</p>
                                        </div>
                                        <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider capitalize",
                                            loan.status === 'defaulted' ? "bg-red-50 text-red-600" :
                                                loan.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {loan.status}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-end justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-400 uppercase font-medium">Approved Amount</p>
                                            <p className="text-2xl font-bold text-slate-900">{formatCurrency(loan.amount)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Due Date</p>
                                            <p className="font-medium text-slate-800">{loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'TBD'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
                                        <div
                                            className={cn("h-1.5 rounded-full", loan.status === 'defaulted' ? "bg-red-400" : "bg-blue-500")}
                                            style={{ width: loan.status === 'approved' ? '20%' : '50%' }}
                                        ></div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* History Section */}
                    <div className="pt-6">
                        <h2 className="font-bold text-slate-800 text-lg mb-4">Loan History</h2>
                        <Card className="p-0 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Borrower</th>
                                        <th className="px-6 py-3 font-medium">Amount</th>
                                        <th className="px-6 py-3 font-medium">Date</th>
                                        <th className="px-6 py-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading history...</td></tr>
                                    ) : loanHistory.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No loan history</td></tr>
                                    ) : (
                                        loanHistory.map((history) => (
                                            <tr key={history.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 font-medium text-slate-900">{history.purpose || 'Personal Loan'}</td>
                                                <td className="px-6 py-4 text-slate-600">{formatCurrency(history.amount)}</td>
                                                <td className="px-6 py-4 text-slate-500">{new Date(history.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={cn("inline-flex items-center gap-1.5 font-medium text-xs capitalize",
                                                        history.status === 'repaid' ? "text-emerald-600" : "text-red-500"
                                                    )}>
                                                        {history.status === 'repaid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                                        {history.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Info - Calculator/Rules */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center">
                        <h3 className="font-bold text-lg mb-2">Need Cash?</h3>
                        <p className="text-blue-100 text-sm mb-6">
                            You are eligible for a loan up to <br />
                            <span className="text-2xl font-bold text-white block mt-1">RWF 1,050,000</span>
                        </p>
                        <button className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-colors border border-white/20">
                            Check Calculator
                        </button>
                    </div>

                    <Card className="p-5">
                        <h3 className="font-bold text-slate-900 mb-3 text-sm">Loan Rules</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>Max interest rate: 5% per month</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>Repayment period: Up to 6 months</span>
                            </li>
                            <li className="flex gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>Requires 2 guarantors</span>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}
