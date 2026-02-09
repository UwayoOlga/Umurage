import { StatCard, Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Wallet,
    TrendingUp,
    Users,
    AlertCircle,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Banknote
} from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Muraho, Jean! 👋</h1>
                    <p className="text-slate-500 text-sm mt-1">Here's what's happening with your group today.</p>
                </div>
                <div className="hidden md:flex items-center gap-3">
                    <span className="text-sm text-slate-500">Last updated: Just now</span>
                    <button className="btn-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Schedule Meeting</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Savings"
                    value="RWF 2,450,000"
                    icon={Wallet}
                    trend="+12% this month"
                    trendUp={true}
                />
                <StatCard
                    label="Active Loans"
                    value="RWF 850,000"
                    icon={TrendingUp}
                    color="text-blue-600"
                />
                <StatCard
                    label="Active Members"
                    value="24"
                    icon={Users}
                    color="text-purple-600"
                    trend="+2 new members"
                    trendUp={true}
                />
                <StatCard
                    label="Pending Actions"
                    value="3"
                    icon={AlertCircle}
                    color="text-amber-500"
                    trend="Requires attention"
                    trendUp={false}
                />
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
                        <button className="text-sm text-emerald-600 font-medium hover:underline">View All</button>
                    </div>

                    <Card className="p-0 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {[
                                { name: "Marie Mukamana", type: "Contribution", amount: "+5,000 RWF", date: "Today, 10:23 AM", status: "success" },
                                { name: "Jean Claude", type: "Loan Repayment", amount: "+12,000 RWF", date: "Today, 09:15 AM", status: "success" },
                                { name: "Group Saving", type: "Bank Deposit", amount: "-150,000 RWF", date: "Yesterday", status: "pending" },
                                { name: "Alice Uwase", type: "Loan Disbursement", amount: "-50,000 RWF", date: "Yesterday", status: "success" },
                            ].map((tx, i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-full", tx.amount.startsWith('+') ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600")}>
                                            {tx.amount.startsWith('+') ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{tx.name}</p>
                                            <p className="text-xs text-slate-500">{tx.type} • {tx.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("font-bold", tx.amount.startsWith('+') ? "text-emerald-700" : "text-slate-700")}>
                                            {tx.amount}
                                        </p>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider",
                                            tx.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                        )}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column - Quick Actions & Reminders */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 block">Record<br />Saving</span>
                        </button>
                        <button className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Banknote className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 block">Approve<br />Loan</span>
                        </button>
                        <button className="p-4 bg-white border border-slate-200 rounded-xl hover:border-purple-500 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 block">Add<br />Member</span>
                        </button>
                        <button className="p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 block">Send<br />Reminder</span>
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet className="w-32 h-32" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Next Meeting</h3>
                        <p className="text-emerald-100 text-sm mb-4 relative z-10">
                            Saturday, 12th Feb<br />
                            10:00 AM - 11:30 AM
                        </p>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors relative z-10">
                            View Agenda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
