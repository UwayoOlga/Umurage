"use client";

import { StatCard, Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import {
    Wallet,
    TrendingUp,
    Users,
    AlertCircle,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Banknote,
    Loader2,
    CheckCircle2,
    Plus
} from 'lucide-react';

import { dashboardService } from '@/lib/services/dashboard.service';
import { savingService } from '@/lib/services/saving.service';
import { loanService } from '@/lib/services/loan.service';
import { groupService } from '@/lib/services/group.service';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showSavingModal, setShowSavingModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // Form states
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [purpose, setPurpose] = useState("");
    const [duration, setDuration] = useState("1");
    // Join Community states
    const [nationalId, setNationalId] = useState("");
    const [rcaNumber, setRcaNumber] = useState("");
    const [communityName, setCommunityName] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<any>(null);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                dashboardService.getSummary(),
                groupService.getMyGroups()
            ]);

            const [summaryRes, groupsRes] = results;

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

            if (summaryRes.status === 'fulfilled') {
                setSummary(summaryRes.value.data);
            }

            if (groupsRes.status === 'fulfilled') {
                setGroups(groupsRes.value.data);
                if (groupsRes.value.data.length > 0) {
                    setSelectedGroupId(groupsRes.value.data[0].id);
                }
            }
        } catch (error: any) {
            console.error('Error fetching dashboard summary:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchSummary();
        }
    }, [user]);

    const handleSavingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await savingService.recordContribution({
                groupId: selectedGroupId,
                amount: parseFloat(amount),
                paymentMethod: 'momo',
                notes
            });
            setSuccess('saving');
            setTimeout(() => {
                setShowSavingModal(false);
                setSuccess(null);
                setAmount("");
                fetchSummary();
            }, 2000);
        } catch (error) {
            alert("Failed to record deposit");
        } finally {
            setSubmitting(false);
        }
    };

    const handleLoanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await loanService.applyForLoan({
                groupId: selectedGroupId,
                amount: parseFloat(amount),
                purpose: purpose,
                durationMonths: parseInt(duration)
            });
            setSuccess({ type: 'loan', data: res.data });
            setTimeout(() => {
                setShowLoanModal(false);
                setSuccess(null);
                setAmount("");
                setPurpose("");
                fetchSummary();
            }, 3000);
        } catch (error) {
            alert("Failed to submit loan request");
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await groupService.joinGroup({ nationalId, rcaNumber, communityName });
            setSuccess('join');
            setTimeout(() => {
                setShowJoinModal(false);
                setSuccess(null);
                setNationalId("");
                setRcaNumber("");
                setCommunityName("");
                fetchSummary();
            }, 2000);
        } catch (error: any) {
            alert(error.message || "Failed to join community");
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

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.hello')}, {user?.name?.split(' ')[0] || 'Member'}! 👋</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('dashboard.welcome')}.</p>
                </div>
                <div className="hidden md:flex items-center gap-3">
                    <span className="text-sm text-slate-500">{t('dashboard.last_updated')}: {t('dashboard.just_now')}</span>
                    <button className="btn-primary flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{t('dashboard.schedule_meeting')}</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label={t('dashboard.total_savings')}
                    value={loading ? "..." : formatCurrency(summary?.totalSavings || 0)}
                    icon={Wallet}
                    trend={loading ? undefined : "+0% this month"}
                    trendUp={true}
                />
                <StatCard
                    label={t('dashboard.active_loans')}
                    value={loading ? "..." : formatCurrency(summary?.activeLoans || 0)}
                    icon={TrendingUp}
                    color="text-blue-600"
                />
                <StatCard
                    label={t('communities.members')}
                    value={loading ? "..." : (summary?.activeMembers || 0).toString()}
                    icon={Users}
                    color="text-purple-600"
                    trend={loading ? undefined : "+0 new members"}
                    trendUp={true}
                />
                <StatCard
                    label={t('loans.pending')}
                    value={loading ? "..." : (summary?.pendingActions || 0).toString()}
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
                        <h2 className="text-lg font-bold text-slate-800">{t('dashboard.recent_activity')}</h2>
                        <button className="text-sm text-emerald-600 font-medium hover:underline">{t('dashboard.view_all')}</button>
                    </div>

                    <Card className="p-0 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">Loading activity...</div>
                            ) : summary?.recentTransactions?.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">No recent activity</div>
                            ) : (
                                summary?.recentTransactions?.map((tx: any, i: number) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("p-2 rounded-full", tx.type === 'regular' || tx.type === 'contribution' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600")}>
                                                <ArrowDownLeft className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{tx.member_name || 'Member'}</p>
                                                <p className="text-xs text-slate-500 capitalize">{tx.type.replace('_', ' ')} • {new Date(tx.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn("font-bold text-emerald-700")}>
                                                {formatCurrency(tx.amount)}
                                            </p>
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-emerald-50 text-emerald-600")}>
                                                completed
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column - Quick Actions & Reminders */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-800">{t('dashboard.quick_actions')}</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowSavingModal(true)}
                            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group text-left"
                        >
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 block text-sm">{t('dashboard.record_deposit')}</span>
                        </button>
                        <button
                            onClick={() => setShowLoanModal(true)}
                            className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left"
                        >
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Banknote className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 block text-sm">{t('dashboard.apply_loan')}</span>
                        </button>
                        <button onClick={() => setShowJoinModal(true)} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 block text-sm">{t('communities.join_group')}</span>
                        </button>
                        <button className="p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-500 hover:shadow-md transition-all group text-left">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-slate-700 block text-sm">Send<br />Reminder</span>
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

            {/* Record Deposit Modal */}
            <Modal
                isOpen={showSavingModal}
                onClose={() => !submitting && setShowSavingModal(false)}
                title="Record Deposit"
            >
                {success === 'saving' ? (
                    <div className="py-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Success!</h4>
                        <p className="text-slate-500 mt-2">Contribution recorded.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSavingSubmit} className="space-y-4">
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            required
                        >
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount (RWF)"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            required
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Record Deposit"}
                        </button>
                    </form>
                )}
            </Modal>

            {/* Request Loan Modal */}
            <Modal
                isOpen={showLoanModal}
                onClose={() => !submitting && setShowLoanModal(false)}
                title="Request Loan"
            >
                {typeof success === 'object' && success?.type === 'loan' ? (
                    <div className="py-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Application Sent!</h4>
                        <p className="text-slate-500 mt-2">AI Score: {success.data.aiScore}%</p>
                    </div>
                ) : (
                    <form onSubmit={handleLoanSubmit} className="space-y-4">
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            required
                        >
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount (RWF)"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            required
                        />
                        <textarea
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="Loan Purpose"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                            required
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Loan"}
                        </button>
                    </form>
                )}
            </Modal>

            {/* Join Community Modal */}
            <Modal
                isOpen={showJoinModal}
                onClose={() => !submitting && setShowJoinModal(false)}
                title="Join Official RCA Community"
            >
                {success === 'join' ? (
                    <div className="py-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900">Successfully Joined!</h4>
                        <p className="text-slate-500 mt-2">You are now an active member.</p>
                    </div>
                ) : (
                    <form onSubmit={handleJoinSubmit} className="space-y-4">
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mb-4">
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Official Verification</p>
                            <p className="text-xs text-amber-700">Provide the RCA details to instantly join your registered community.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Your National ID</label>
                            <input
                                type="text"
                                value={nationalId}
                                onChange={(e) => setNationalId(e.target.value.replace(/[^0-9]/g, '').slice(0, 16))}
                                placeholder="16-Digit ID Number"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">RCA Number</label>
                            <input
                                type="text"
                                value={rcaNumber}
                                onChange={(e) => setRcaNumber(e.target.value)}
                                placeholder="e.g. RCA/2026/001234"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Community Name</label>
                            <input
                                type="text"
                                value={communityName}
                                onChange={(e) => setCommunityName(e.target.value)}
                                placeholder="Exact Official Name"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 mt-2"
                        >
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Details & Join"}
                        </button>
                    </form>
                )}
            </Modal>
        </div>
    );
}
