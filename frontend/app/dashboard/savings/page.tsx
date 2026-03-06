"use client";

import {
    PiggyBank,
    Wallet,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    Calendar,
    Filter,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { dashboardService } from "@/lib/services/dashboard.service";
import { savingService } from "@/lib/services/saving.service";
import { groupService } from "@/lib/services/group.service";
import { useAuth } from "@/context/AuthContext";

export default function SavingsPage() {
    const { logout } = useAuth();
    const [filter, setFilter] = useState("All");
    const [savingsData, setSavingsData] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("momo");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [savingsRes, summaryRes, groupsRes] = await Promise.all([
                savingService.getMySavings(),
                dashboardService.getSummary(),
                groupService.getMyGroups()
            ]);
            setSavingsData(savingsRes.data);
            setSummary(summaryRes.data);
            setGroups(groupsRes.data);
            if (groupsRes.data.length > 0) {
                setSelectedGroupId(groupsRes.data[0].id);
            }
        } catch (error: any) {
            if (error.message && error.message.toLowerCase().includes('token')) {
                logout();
            } else {
                console.log("Error fetching savings data:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroupId || !amount) return;

        setSubmitting(true);
        try {
            await savingService.recordContribution({
                groupId: selectedGroupId,
                amount: parseFloat(amount),
                paymentMethod,
                notes
            });
            setSuccess(true);
            setTimeout(() => {
                setShowModal(false);
                setSuccess(false);
                setAmount("");
                setNotes("");
                fetchData();
            }, 2000);
        } catch (error) {
            console.error("Error recording contribution:", error);
            alert("Failed to record contribution. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0
        }).format(amount).replace('RWF', '').trim() + ' RWF';
    };

    const savingsHistory = savingsData?.savings || [];
    const filteredHistory = filter === "All"
        ? savingsHistory
        : savingsHistory.filter((s: any) => s.type.toLowerCase().includes(filter.toLowerCase().slice(0, -1)));

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
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Record Deposit</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Group Savings"
                    value={loading ? "..." : formatCurrency(summary?.totalSavings || 0)}
                    icon={Wallet}
                    trend={loading ? undefined : "+0% this month"}
                    trendUp={true}
                />
                <StatCard
                    label="My Contributions"
                    value={loading ? "..." : formatCurrency(savingsData?.total || 0)}
                    icon={PiggyBank}
                    color="text-blue-600"
                    trend={loading ? undefined : "Updated just now"}
                />
                <StatCard
                    label="Interest Earned"
                    value="RWF 0"
                    icon={TrendingUp}
                    color="text-purple-600"
                    trend="APY: 5.0%"
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
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading history...</div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No savings history found</div>
                            ) : (
                                filteredHistory.map((tx: any) => (
                                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-2 rounded-full", tx.type === 'regular' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600")}>
                                                <ArrowDownLeft className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 capitalize">{tx.type} <span className="text-slate-400 font-normal ml-1">to</span> {tx.group_name}</p>
                                                <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()} • {tx.payment_method || 'momo'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn("font-bold text-emerald-700")}>
                                                {formatCurrency(tx.amount)}
                                            </p>
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-emerald-50 text-emerald-600")}>
                                                Completed
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Record Deposit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => !submitting && setShowModal(false)}
                title="Record Deposit"
            >
                {success ? (
                    <div className="py-12 flex flex-col items-center text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Contribution Saved!</h4>
                        <p className="text-slate-500 mt-2">Your contribution has been recorded successfully.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Group</label>
                            <select
                                value={selectedGroupId}
                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                required
                            >
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (RWF)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g. 5000"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                required
                                min="100"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['momo', 'cash', 'sacco'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method)}
                                        className={cn(
                                            "py-2 px-1 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all",
                                            paymentMethod === method
                                                ? "bg-emerald-600 border-emerald-600 text-white"
                                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Monthly contribution for March"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[80px]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || groups.length === 0}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {submitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                            ) : (
                                "Confirm Deposit"
                            )}
                        </button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
