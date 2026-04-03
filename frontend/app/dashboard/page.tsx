"use client";

import { Card } from '@/components/ui/card';
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
    Plus,
    PiggyBank,
    HandCoins,
    Download,
    FileText,
    History,
    Volume2,
    Home,
    GraduationCap,
    ShoppingBag,
    Briefcase,
    Stethoscope,
    Sprout,
    Vote
} from 'lucide-react';

import { dashboardService } from '@/lib/services/dashboard.service';
import { adminService } from '@/lib/services/admin.service';
import { savingService } from '@/lib/services/saving.service';
import { loanService } from '@/lib/services/loan.service';
import { groupService } from '@/lib/services/group.service';
import { governanceService } from '@/lib/services/governance.service';
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
    const [showReportsModal, setShowReportsModal] = useState(false);

    // Reports states
    const [reportsData, setReportsData] = useState<any[]>([]);
    const [reportsType, setReportsType] = useState('member_statement');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [openElection, setOpenElection] = useState<any>(null);
    const [showVoteModal, setShowVoteModal] = useState(false);

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
                    const gid = groupsRes.value.data[0].id;
                    setSelectedGroupId(gid);

                    // Fetch group members for leaders to use in reports
                    const membersRes = await dashboardService.getGroupMemberList(gid);
                    if (membersRes.success) setGroupMembers(membersRes.data);

                    // Check for elections
                    const electRes = await governanceService.getOpenElections(gid);
                    if (electRes.success) setOpenElection(electRes.data);
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

    const fetchReports = async (type: string, memberId?: string) => {
        setReportsLoading(true);
        setReportsType(type);
        if (memberId) setSelectedMemberId(memberId);

        try {
            const res = await adminService.getReports(type, selectedGroupId, memberId || (type === 'member_statement' ? undefined : selectedMemberId));
            setReportsData(res.data);
        } finally {
            setReportsLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const params = new URLSearchParams({
                type: reportsType,
                groupId: selectedGroupId,
                memberId: selectedMemberId
            });

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const response = await fetch(`${apiUrl}/admin/reports/download?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Umurage_Report_${reportsType}_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handleLoanSubmit = async (e: React.FormEvent | null) => {
        if (e) e.preventDefault();
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

    const speak = (text: string) => {
        if (!('speechSynthesis' in window)) return;

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Language auto-detect logic
        if (text.includes("Kanda")) utterance.lang = 'rw-RW';
        else utterance.lang = 'en-US';

        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
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
                </div>
            </div>

            {/* Visual Action Grid - Mobile First & Low-Literacy Friendly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <button
                    onClick={() => setShowSavingModal(true)}
                    className="relative overflow-hidden group p-6 rounded-3xl bg-emerald-600 border border-emerald-500 shadow-xl shadow-emerald-200/50 hover:scale-[1.02] transition-all text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500">
                        <PiggyBank className="w-24 h-24 text-white" />
                    </div>
                    <div
                        onClick={(e) => { e.stopPropagation(); speak("Kanda hano niba ushaka kubitsa amafaranga yawe."); }}
                        className="absolute bottom-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors z-20"
                        title="In-Ear Assistant (Rwanda)"
                    >
                        <Volume2 className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <PiggyBank className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white leading-tight">{t('dashboard.record_deposit')}</h3>
                            <p className="text-emerald-100 text-sm font-medium mt-1">Add to your savings</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setShowLoanModal(true)}
                    className="relative overflow-hidden group p-6 rounded-3xl bg-blue-600 border border-blue-500 shadow-xl shadow-blue-200/50 hover:scale-[1.02] transition-all text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500">
                        <HandCoins className="w-24 h-24 text-white" />
                    </div>
                    <div
                        onClick={(e) => { e.stopPropagation(); speak("Kanda hano niba ushaka gusaba inguzanyo."); }}
                        className="absolute bottom-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors z-20"
                    >
                        <Volume2 className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <HandCoins className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white leading-tight">{t('dashboard.apply_loan')}</h3>
                            <p className="text-blue-100 text-sm font-medium mt-1">Request money now</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setShowJoinModal(true)}
                    className="relative overflow-hidden group p-6 rounded-3xl bg-purple-600 border border-purple-500 shadow-xl shadow-purple-200/50 hover:scale-[1.02] transition-all text-left"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform duration-500">
                        <Users className="w-24 h-24 text-white" />
                    </div>
                    <div
                        onClick={(e) => { e.stopPropagation(); speak("Kanda hano niba ushaka kureba amatsinda yawe."); }}
                        className="absolute bottom-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors z-20"
                    >
                        <Volume2 className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <Users className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white leading-tight">{t('communities.join_group')}</h3>
                            <p className="text-purple-100 text-sm font-medium mt-1">Find your neighbors</p>
                        </div>
                    </div>
                </button>

                <AgasekeProgress
                    current={summary?.totalSavings || 0}
                    goal={100000}
                    loading={loading}
                    label="Saving Basket"
                />
            </div>

            {/* LIVE ELECTION ALERT - High Priority */}
            {openElection && (
                <div className="mb-8 p-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-[2rem] animate-pulse">
                    <button
                        onClick={() => setShowVoteModal(true)}
                        className="w-full bg-white rounded-[1.9rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 transition-transform hover:scale-[1.01]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center">
                                <Vote className="w-10 h-10 text-amber-600" />
                            </div>
                            <div className="text-left">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg uppercase tracking-widest">Election Live</span>
                                <h2 className="text-xl font-black text-slate-900 mt-1">Vote for New {openElection.role_type.toUpperCase()}!</h2>
                                <p className="text-sm text-slate-500">Your community is choosing a new leader. Your voice matters.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-4">
                                {openElection.candidates.map((c: any, i: number) => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                        {c.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <span className="btn-primary py-3 px-8 bg-amber-600 hover:bg-amber-700 border-none shadow-lg shadow-amber-200">
                                Cast Your Vote
                            </span>
                        </div>
                    </button>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
                    trend="Check now"
                    trendUp={false}
                />
                <StatCard
                    label="Rotation Turn"
                    value={loading ? "..." : "Next Week"}
                    icon={Calendar}
                    color="text-emerald-600"
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
                    <div className="grid grid-cols-2 gap-4">
                        <ActionCard
                            icon={<Users className="w-8 h-8" />}
                            title="Community"
                            subtitle="Join Ikimina"
                            color="bg-blue-500"
                            onClick={() => setShowJoinModal(true)}
                        />

                        <ActionCard
                            icon={<FileText className="w-8 h-8" />}
                            title="Statements"
                            subtitle="Download DNA"
                            color="bg-purple-600"
                            onClick={() => {
                                setShowReportsModal(true);
                                fetchReports('member_statement');
                            }}
                        />
                    </div>
                </div>

                {/* Right Column - Quick Actions & Reminders */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-800">Support</h2>
                    <Card className="p-6 bg-slate-50 border-none shadow-none text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1 leading-tight">Your money is safe</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">System protected by National Bank of Rwanda compliance standards.</p>
                        <button className="mt-4 w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                            How to use this app?
                        </button>
                    </Card>

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

                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest px-1">Purpose of Loan</label>
                            <VisualPurposePicker value={purpose} onChange={(val: string) => setPurpose(val)} />
                        </div>

                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Amount (RWF)"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-lg"
                            required
                        />

                        <button
                            type="submit"
                            disabled={submitting || !purpose}
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
            {/* Reports Modal */}
            <Modal
                isOpen={showReportsModal}
                onClose={() => setShowReportsModal(false)}
                title="Financial Statements & DNA"
            >
                <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                        <button
                            onClick={() => fetchReports('member_statement')}
                            className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", reportsType === 'member_statement' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500")}
                        >
                            Personal
                        </button>
                        {(user?.role === 'admin' || user?.role === 'treasurer') && (
                            <>
                                <button
                                    onClick={() => fetchReports('group_performance')}
                                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", reportsType === 'group_performance' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500")}
                                >
                                    Group
                                </button>
                                <button
                                    onClick={() => { setReportsType('member_performance'); setReportsData(null); }}
                                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", reportsType === 'member_performance' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500")}
                                >
                                    Member
                                </button>
                            </>
                        )}
                    </div>

                    {reportsType === 'member_performance' && (
                        <div className="space-y-3">
                            <select
                                value={selectedMemberId}
                                onChange={(e) => fetchReports('member_performance', e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sm"
                            >
                                <option value="">-- Choose Member to Audit --</option>
                                {groupMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Member Performance Header */}
                    {reportsType === 'member_performance' && reportsData?.stats && (
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Consistency</p>
                                <p className="text-xl font-black text-emerald-900">{reportsData.stats.consistency.toFixed(1)}%</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Active Debt</p>
                                <p className="text-xl font-black text-amber-900">{formatCurrency(reportsData.stats.active_debt)}</p>
                            </div>
                        </div>
                    )}

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {reportsLoading ? (
                            <div className="py-12 flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-emerald-600 w-8 h-8" />
                                <p className="text-xs font-bold text-slate-400">Compiling Report...</p>
                            </div>
                        ) : !reportsData || (Array.isArray(reportsData) && reportsData.length === 0) ? (
                            <p className="text-center py-12 text-slate-400 text-sm italic border-2 border-dashed border-slate-50 rounded-3xl">
                                Select a member or report type to begin.
                            </p>
                        ) : (
                            (reportsType === 'member_performance' ? reportsData.history : reportsData).map((rpt: any, i: number) => (
                                <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between hover:border-emerald-200 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", rpt.status === 'completed' || rpt.status === 'disbursed' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500")}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 capitalize">{rpt.type || rpt.doc_type || 'Record'}</p>
                                            <p className="text-[9px] text-slate-400">{new Date(rpt.date || rpt.created_at).toLocaleDateString()} • {rpt.status || 'Verified'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">{formatCurrency(rpt.amount)}</p>
                                        <Download className="w-3 h-3 text-slate-300 ml-auto mt-1 cursor-pointer hover:text-emerald-600" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={handleDownloadPDF}
                        disabled={!reportsData}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Download Detailed PDF DNA
                    </button>
                </div>
            </Modal>

            {/* VOTE MODAL */}
            <Modal
                isOpen={showVoteModal}
                onClose={() => !submitting && setShowVoteModal(false)}
                title={`Election: New ${openElection?.role_type?.toUpperCase()}`}
            >
                <div className="space-y-6 py-2 text-center">
                    <p className="text-sm text-slate-500">Choose the member you trust to be the next {openElection?.role_type}.</p>

                    <div className="grid grid-cols-1 gap-3">
                        {openElection?.candidates.map((cand: any) => (
                            <button
                                key={cand.member_id}
                                onClick={async () => {
                                    setSubmitting(true);
                                    try {
                                        await governanceService.vote(openElection.id, cand.member_id);
                                        setSuccess('vote');
                                        setTimeout(() => {
                                            setShowVoteModal(false);
                                            setSuccess(null);
                                            fetchSummary();
                                        }, 2000);
                                    } catch (err: any) {
                                        alert(err.message || "Failed to vote");
                                    } finally {
                                        setSubmitting(false);
                                    }
                                }}
                                disabled={submitting}
                                className="p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-amber-400 hover:bg-white transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
                                        {cand.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{cand.name}</p>
                                        <p className="text-xs text-slate-500">{cand.phone}</p>
                                    </div>
                                </div>
                                <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-amber-500 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-amber-500 scale-0 group-hover:scale-100 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {success === 'vote' && (
                        <p className="text-emerald-600 font-bold bg-emerald-50 py-2 rounded-lg">Vote cast successfully!</p>
                    )}
                </div>
            </Modal>
        </div>
    );
}

// Low-literacy friendly action cards
function ActionCard({ icon, title, subtitle, color, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-4 p-4 rounded-3xl bg-white border-2 border-slate-50 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all text-left w-full group"
        >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform", color)}>
                {icon}
            </div>
            <div>
                <h4 className="font-black text-slate-900 leading-tight">{title}</h4>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">{subtitle}</p>
            </div>
        </button>
    );
}

// Standard data display stats
function StatCard({ label, value, icon: Icon, color, trend, trendUp }: any) {
    return (
        <Card className="p-4 border-none shadow-sm bg-white overflow-hidden relative">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl bg-slate-50", color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-black text-slate-900 truncate">{value}</p>
                    {trend && (
                        <p className={cn("text-[8px] font-bold", trendUp ? "text-emerald-600" : "text-amber-500")}>
                            {trend}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}

// Visual Purpose Picker for Low-Literacy users
function VisualPurposePicker({ value, onChange }: any) {
    const purposes = [
        { id: 'seeds', label: 'Agriculture', kiny: 'Ubuhinzi', icon: <Sprout className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-600' },
        { id: 'house', label: 'Housing', kiny: 'Inzu', icon: <Home className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
        { id: 'school', label: 'Education', kiny: 'Ishuri', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-indigo-100 text-indigo-600' },
        { id: 'business', label: 'Business', kiny: 'Ubucuruzi', icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600' },
        { id: 'health', label: 'Medical', kiny: 'Kwasakura', icon: <Stethoscope className="w-5 h-5" />, color: 'bg-red-100 text-red-600' }
    ];

    return (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {purposes.map((p) => (
                <button
                    key={p.id}
                    type="button"
                    onClick={() => onChange(p.id)}
                    className={cn(
                        "flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all group",
                        value === p.id
                            ? "bg-emerald-50 border-emerald-500 scale-105"
                            : "bg-white border-transparent hover:border-slate-100"
                    )}
                >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", p.color)}>
                        {p.icon}
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-slate-800 leading-none">{p.kiny}</p>
                        <p className="text-[7px] font-medium text-slate-400 hidden sm:block uppercase tracking-tighter mt-0.5">{p.label}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}

// Visual Progress Indicator for Low-Literacy Users
function AgasekeProgress({ current, goal, loading, label }: any) {
    const percentage = Math.min(Math.round((current / goal) * 100), 100);
    const fillHeight = 100 - percentage;

    return (
        <Card className="p-6 rounded-3xl bg-white border-2 border-slate-100 flex items-center gap-6 shadow-sm overflow-hidden group">
            {/* The Agaseke Silhouette */}
            <div className="relative w-20 h-28 shrink-0 bg-slate-50 rounded-t-[50%] rounded-b-[20%] overflow-hidden border border-slate-100">
                {/* Dynamic Fill Wave */}
                <div
                    className="absolute bottom-0 left-0 w-full bg-emerald-500 transition-all duration-1000 ease-out"
                    style={{ height: `${percentage}%` }}
                >
                    <div className="absolute top-0 left-0 w-[200%] h-4 -translate-y-full bg-emerald-500 opacity-50 animate-[wave_3s_infinite_linear] rounded-[40%]" />
                </div>

                {/* Agaseke Pattern Overlay */}
                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 140">
                    <path d="M50 0 L100 40 L100 140 L0 140 L0 40 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 40 Q50 30 80 40" fill="none" stroke="currentColor" strokeWidth="1" />
                    <path d="M0 70 L100 70 M0 100 L100 100" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                </svg>
            </div>

            <div className="flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                    {loading ? "..." : `${percentage}% Full`}
                </p>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Community Pride</p>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 font-medium">Keep saving to grow your future.</p>
            </div>

            <style jsx>{`
                @keyframes wave {
                    from { transform: translateY(-70%) translateX(0); }
                    to { transform: translateY(-70%) translateX(-50%); }
                }
            `}</style>
        </Card>
    );
}
