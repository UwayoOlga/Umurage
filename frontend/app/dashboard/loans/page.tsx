"use client";

import {
    Banknote, Plus, Calendar, AlertCircle, CheckCircle2,
    Loader2, X, Shield, TrendingUp, Clock
} from "lucide-react";
import { Card, StatCard } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { dashboardService } from "@/lib/services/dashboard.service";
import { loanService } from "@/lib/services/loan.service";
import { groupService } from "@/lib/services/group.service";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function LoansPage() {
    const { logout } = useAuth();
    const { t } = useLanguage();
    const [loans, setLoans] = useState<any[]>([]);
    const [pendingLoans, setPendingLoans] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'my_loans' | 'pending_approval'>('my_loans');

    // Form state
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [amount, setAmount] = useState("");
    const [purpose, setPurpose] = useState("");
    const [duration, setDuration] = useState("1");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<any>(null);

    // Repayment state
    const [repayModalOpen, setRepayModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<any>(null);
    const [repayAmount, setRepayAmount] = useState("");
    const [repayMethod, setRepayMethod] = useState("momo");
    const [repaymentSubmitting, setRepaymentSubmitting] = useState(false);
    const [repaySuccess, setRepaySuccess] = useState(false);

    // Approval state
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [reviewLoan, setReviewLoan] = useState<any>(null);
    const [adjAmount, setAdjAmount] = useState("");
    const [adjInterest, setAdjInterest] = useState("5.0");
    const [adjDueDate, setAdjDueDate] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                loanService.getMyLoans(),
                dashboardService.getSummary(),
                groupService.getMyGroups(),
                loanService.getPendingLoans(),
            ]);

            const [loansRes, summaryRes, groupsRes, pendingRes] = results;

            // Check if any request failed due to token issues
            for (const res of results) {
                if (res.status === 'rejected') {
                    const msg = res.reason?.message || "";
                    if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('authorized')) {
                        logout();
                        return;
                    }
                }
            }

            if (loansRes.status === 'fulfilled') {
                const fetchedLoans = loansRes.value.data;
                setLoans(fetchedLoans);

                // Calculate active loans sum manually
                const activeSum = fetchedLoans
                    .filter((l: any) => ['approved', 'disbursed', 'pending'].includes(l.status))
                    .reduce((sum: number, loan: any) => sum + Number(loan.amount || 0), 0);

                setSummary({ activeLoans: activeSum });
            }
            if (summaryRes.status === 'fulfilled') {
                setSummary(summaryRes.value.data);
            }
            if (groupsRes.status === 'fulfilled') {
                setGroups(groupsRes.value.data);
                if (groupsRes.value.data.length > 0) setSelectedGroupId(groupsRes.value.data[0].id);
            }
            if (pendingRes.status === 'fulfilled') setPendingLoans(pendingRes.value.data);
        } catch (error: any) {
            console.error("fetchData unexpected error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroupId || !amount) return;
        setSubmitting(true);
        try {
            const res = await loanService.applyForLoan({
                groupId: selectedGroupId,
                amount: parseFloat(amount),
                purpose,
                durationMonths: parseInt(duration)
            });
            setSuccess(res.data);
            setTimeout(() => {
                setShowModal(false);
                setSuccess(null);
                setAmount("");
                setPurpose("");
                fetchData();
            }, 3000);
        } catch (error: any) {
            alert(error.message || "Failed to submit loan application. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = (loan: any) => {
        setReviewLoan(loan);
        setAdjAmount(loan.amount.toString());
        setAdjInterest(loan.interest_rate?.toString() || "5.0");
        setAdjDueDate(loan.due_date ? loan.due_date.split('T')[0] : "");
        setShowApproveModal(true);
    };

    const handleFinalApprove = async () => {
        if (!reviewLoan) return;
        setActionLoading(reviewLoan.id);
        try {
            await loanService.approveLoan(reviewLoan.id, {
                amount: parseFloat(adjAmount),
                interestRate: parseFloat(adjInterest),
                dueDate: adjDueDate
            });
            setShowApproveModal(false);
            fetchData();
        } catch (error: any) {
            alert(error.message || "Failed to approve loan");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (loanId: string) => {
        if (!window.confirm("Are you sure you want to reject this loan application?")) return;
        setActionLoading(loanId);
        try {
            await loanService.rejectLoan(loanId);
            fetchData();
        } catch (error: any) {
            alert(error.message || "Failed to reject loan");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRepay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLoan || !repayAmount) return;

        setRepaymentSubmitting(true);
        try {
            await loanService.repayLoan(selectedLoan.id, {
                amount: parseFloat(repayAmount),
                paymentMethod: repayMethod,
            });
            setRepaySuccess(true);
            setTimeout(() => {
                setRepayModalOpen(false);
                setRepaySuccess(false);
                setRepayAmount("");
                setSelectedLoan(null);
                fetchData();
            }, 2000);
        } catch (error: any) {
            alert(error.message || "Failed to record repayment.");
        } finally {
            setRepaymentSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency', currency: 'RWF', minimumFractionDigits: 0
        }).format(amount).replace('RWF', '').trim() + ' RWF';
    };

    const getLoanStatusMeta = (status: string) => {
        switch (status) {
            case 'approved': return { label: t('loans.status.approved'), cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' };
            case 'disbursed': return { label: t('loans.status.disbursed'), cls: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500' };
            case 'pending': return { label: t('loans.status.pending'), cls: 'bg-amber-50 text-amber-700 border-amber-200', bar: 'bg-amber-400' };
            case 'rejected': return { label: t('loans.status.rejected'), cls: 'bg-red-50 text-red-700 border-red-200', bar: 'bg-red-400' };
            case 'repaid': return { label: t('loans.status.repaid'), cls: 'bg-slate-50 text-slate-600 border-slate-200', bar: 'bg-slate-300' };
            default: return { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200', bar: 'bg-slate-300' };
        }
    };

    const activeLoans = loans.filter(l => ['approved', 'disbursed', 'pending'].includes(l.status));
    const loanHistory = loans.filter(l => ['repaid', 'rejected', 'defaulted'].includes(l.status));
    const isLeader = pendingLoans.length > 0 || groups.some(g => ['admin', 'treasurer'].includes(g.role));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Banknote className="w-6 h-6 text-blue-600" />
                        {t('loans.title')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">{t('loans.subtitle')}</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-blue-200">
                    <Plus className="w-4 h-4" />
                    <span>{t('loans.req_loan')}</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label={t('loans.active_balance')}
                    value={loading ? "..." : formatCurrency(summary?.activeLoans || 0)}
                    icon={Banknote}
                    color="text-blue-600"
                    trend={loading ? undefined : `${activeLoans.length} ${t('loans.active_loans').toLowerCase()}`}
                />
                <StatCard
                    label={t('loans.pending')}
                    value={loading ? "..." : `${loans.filter(l => l.status === 'pending').length}`}
                    icon={Clock}
                    color="text-amber-600"
                    trend="Awaiting Treasurer review"
                />
                <StatCard
                    label={t('loans.credit_score')}
                    value={loans.length > 0 ? `${loans[0]?.ai_score || '--'}%` : '--'}
                    icon={TrendingUp}
                    color="text-emerald-600"
                    trend="Last application score"
                    trendUp={true}
                />
            </div>

            {/* Tabs — only show leader tab if they are a treasurer/admin */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('my_loans')}
                    className={cn('px-5 py-2 rounded-lg text-sm font-bold transition-all',
                        activeTab === 'my_loans' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                    💰 {t('loans.my_loans')} ({loans.length})
                </button>
                {isLeader && (
                    <button onClick={() => setActiveTab('pending_approval')}
                        className={cn('px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
                            activeTab === 'pending_approval' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                        <Shield className="w-4 h-4" />
                        {t('loans.pending')}
                        {pendingLoans.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {pendingLoans.length}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* ─── MY LOANS TAB ─── */}
            {activeTab === 'my_loans' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            {t('loans.active_loans')}
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{activeLoans.length}</span>
                        </h2>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading loans...</div>
                            ) : activeLoans.length === 0 ? (
                                <Card className="p-12 text-center border-dashed border-2">
                                    <Banknote className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                    <p className="font-bold text-slate-800">No Active Loans</p>
                                    <p className="text-slate-500 text-sm mt-1">Tap "Request Loan" to apply for one.</p>
                                </Card>
                            ) : (
                                activeLoans.map((loan) => {
                                    const meta = getLoanStatusMeta(loan.status);
                                    return (
                                        <Card key={loan.id} className={cn("p-5 hover:shadow-md transition-all border-l-4",
                                            loan.status === 'pending' ? 'border-l-amber-400' : loan.status === 'approved' ? 'border-l-emerald-500' : 'border-l-blue-500')}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg">{loan.purpose || 'Personal Loan'}</h3>
                                                    <p className="text-slate-500 text-sm">Group: {loan.group_name}</p>
                                                </div>
                                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border", meta.cls)}>
                                                    {meta.label}
                                                </span>
                                            </div>
                                            <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1 text-[10px] uppercase font-bold tracking-wider">
                                                        <span className="text-slate-400">Repayment Progress</span>
                                                        <span className="text-blue-600">
                                                            {formatCurrency(loan.total_paid || 0)} / {formatCurrency(loan.amount + (loan.amount * (loan.interest_rate / 100)))}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={cn("h-full rounded-full transition-all duration-1000", meta.bar)}
                                                            style={{
                                                                width: `${Math.min(100, Math.round(((loan.total_paid || 0) / (loan.amount + (loan.amount * (loan.interest_rate / 100)))) * 100))}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {['approved', 'disbursed', 'defaulted'].includes(loan.status) && (
                                                    <button
                                                        onClick={() => { setSelectedLoan(loan); setRepayModalOpen(true); }}
                                                        className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs transition-all whitespace-nowrap"
                                                    >
                                                        Repay Part
                                                    </button>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs">
                                                <div className="text-slate-400 font-medium">
                                                    Due: <span className="text-slate-600 font-bold">{loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'TBD'}</span>
                                                </div>
                                                {loan.ai_score && (
                                                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                                        <TrendingUp className="w-3 h-3 text-blue-500" />
                                                        AI Profile: <span className="font-bold text-slate-600">{loan.ai_score}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>

                        {/* History */}
                        {loanHistory.length > 0 && (
                            <div className="pt-4">
                                <h2 className="font-bold text-slate-800 text-lg mb-4">Loan History</h2>
                                <Card className="p-0 overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                            <tr>
                                                <th className="px-6 py-3 font-medium">Purpose</th>
                                                <th className="px-6 py-3 font-medium">Amount</th>
                                                <th className="px-6 py-3 font-medium">Date</th>
                                                <th className="px-6 py-3 font-medium text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {loanHistory.map((h) => (
                                                <tr key={h.id} className="hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 font-medium text-slate-900">{h.purpose || 'Personal Loan'}</td>
                                                    <td className="px-6 py-4 text-slate-600">{formatCurrency(h.amount)}</td>
                                                    <td className="px-6 py-4 text-slate-500">{new Date(h.created_at).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold capitalize",
                                                            h.status === 'repaid' ? "text-emerald-600" : "text-red-500")}>
                                                            {h.status === 'repaid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                                            {h.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center">
                            <h3 className="font-bold text-lg mb-2">{t('loans.need_cash')}</h3>
                            <p className="text-blue-100 text-sm mb-4">{t('loans.apply_desc')}</p>
                            <button onClick={() => setShowModal(true)} className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-semibold transition-colors border border-white/20">
                                {t('loans.req_loan')}
                            </button>
                        </div>
                        <Card className="p-5">
                            <h3 className="font-bold text-slate-900 mb-3 text-sm">{t('loans.rules_title')}</h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                {[t('loans.rule_1'), t('loans.rule_2'), t('loans.rule_3'), t('loans.rule_4')].map(rule => (
                                    <li key={rule} className="flex gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </div>
            )}

            {/* ─── PENDING APPROVAL TAB (Leaders only) ─── */}
            {activeTab === 'pending_approval' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                        <Shield className="w-5 h-5 shrink-0" />
                        <p>{t('loans.treasurer_notice')}</p>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> {t('common.loading')}
                        </div>
                    ) : pendingLoans.length === 0 ? (
                        <Card className="p-16 text-center border-dashed border-2">
                            <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-300 mb-4" />
                            <p className="font-bold text-slate-800 text-lg">{t('loans.all_clear')}</p>
                            <p className="text-slate-500 text-sm mt-1">{t('loans.no_pending')}</p>
                        </Card>
                    ) : (
                        pendingLoans.map((loan) => (
                            <Card key={loan.id} className="p-6 border border-amber-200/60 hover:shadow-md transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        {/* Applicant avatar */}
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shrink-0">
                                            {loan.applicant_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-base">{loan.applicant_name}</p>
                                            <p className="text-sm text-slate-500">{loan.applicant_phone} · {loan.group_name}</p>
                                            <p className="text-sm text-slate-600 mt-2 font-medium">
                                                {t('loans.purpose')}: <span className="text-slate-800">{loan.purpose || t('loans.not_specified')}</span>
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">{t('loans.applied_on')} {new Date(loan.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Requested</p>
                                            <p className="text-2xl font-black text-slate-900">{formatCurrency(loan.amount)}</p>
                                        </div>

                                        {/* AI Score */}
                                        {loan.ai_score && (
                                            <div className={cn("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                                                loan.ai_score >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    loan.ai_score >= 65 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"
                                            )}>
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                AI Score: {loan.ai_score}%
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => handleReject(loan.id)}
                                                disabled={actionLoading === loan.id}
                                                className="px-4 py-2 border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {actionLoading === loan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                                {t('loans.reject')}
                                            </button>
                                            <button
                                                onClick={() => handleApprove(loan)}
                                                disabled={actionLoading === loan.id}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {actionLoading === loan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                                {t('loans.approve')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Request Loan Modal */}
            <Modal isOpen={showModal} onClose={() => !submitting && setShowModal(false)} title="Request a Loan">
                {success ? (
                    <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Application Sent!</h4>
                        <p className="text-slate-500 mt-2 mb-4">Your Treasurer will review and approve it shortly.</p>
                        <div className="p-4 bg-slate-50 rounded-xl w-full border border-slate-100">
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">AI Credit Score</p>
                            <p className="text-3xl font-black text-blue-600">{success.aiScore}%</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Group</label>
                            <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" required>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Requested Amount (RWF)</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g. 50000" min="1000"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                            <select value={duration} onChange={(e) => setDuration(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20">
                                {[1, 2, 3, 4, 5, 6].map(m => <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Loan Purpose</label>
                            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)}
                                placeholder="Describe why you need this loan..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px]" required />
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-blue-800 text-xs">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p>Interest rate is fixed at 5% per month. Total repayment will be calculated upon approval.</p>
                        </div>
                        <button type="submit" disabled={submitting || groups.length === 0}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-4">
                            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : "Apply Now"}
                        </button>
                    </form>
                )}
            </Modal>

            {/* Repay Loan Modal */}
            <Modal isOpen={repayModalOpen} onClose={() => !repaymentSubmitting && setRepayModalOpen(false)} title="Record Repayment">
                {repaySuccess ? (
                    <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Payment Recorded!</h4>
                        <p className="text-slate-500 mt-2">The treasury has been updated.</p>
                    </div>
                ) : (
                    <form onSubmit={handleRepay} className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-xl mb-4 border border-blue-100">
                            <p className="text-xs text-blue-400 uppercase font-bold tracking-wider mb-1">Loan Context</p>
                            <p className="text-sm font-bold text-blue-900">{selectedLoan?.purpose}</p>
                            <div className="flex justify-between mt-2 text-xs">
                                <span className="text-blue-700">Total Owed (with int.):</span>
                                <span className="font-bold text-blue-900">{selectedLoan && formatCurrency(selectedLoan.amount + (selectedLoan.amount * (selectedLoan.interest_rate / 100)))}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Repayment Amount (RWF)</label>
                            <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)}
                                placeholder="e.g. 10000" min="500"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['momo', 'cash', 'sacco'].map(method => (
                                    <button key={method} type="button" onClick={() => setRepayMethod(method)}
                                        className={cn("py-2 px-1 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all",
                                            repayMethod === method ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={repaymentSubmitting}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4">
                            {repaymentSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Recording...</> : "Confirm Payment"}
                        </button>
                    </form>
                )}
            </Modal>

            {/* Approval Review Modal */}
            <Modal isOpen={showApproveModal} onClose={() => !actionLoading && setShowApproveModal(false)} title={t('loans.review_modal')}>
                <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{t('loans.applicant')}</p>
                                <p className="font-bold text-slate-900">{reviewLoan?.applicant_name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{t('loans.credit_score')}</p>
                                <p className="text-xl font-black text-emerald-700">{reviewLoan?.ai_score}%</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 italic">" {reviewLoan?.purpose} "</p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('loans.approved_amount')}</label>
                                <input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value)}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('loans.interest_rate_adj')}</label>
                                <input type="number" step="0.1" value={adjInterest} onChange={e => setAdjInterest(e.target.value)}
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('loans.due_date_adj')}</label>
                            <input type="date" value={adjDueDate} onChange={e => setAdjDueDate(e.target.value)}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900 rounded-xl text-white">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-400 text-xs font-medium">{t('loans.final_total')}</span>
                            <span className="font-bold text-emerald-400">
                                {formatCurrency(parseFloat(adjAmount || "0") * (1 + parseFloat(adjInterest || "0") / 100))}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500">{t('loans.ledger_note')}</p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setShowApproveModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                            {t('common.cancel')}
                        </button>
                        <button onClick={handleFinalApprove} disabled={!!actionLoading}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2">
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {t('common.confirm')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
