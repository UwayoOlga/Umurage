"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Users, PiggyBank, Play, Clock, CheckCircle2,
    Crown, BookOpen, Wallet, User, ChevronDown, Shield, Loader2, Plus, ArrowUp, ArrowDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { dashboardService } from '@/lib/services/dashboard.service';
import { rotationService } from '@/lib/services/rotation.service';
import { groupService } from '@/lib/services/group.service';
import { savingService } from '@/lib/services/saving.service';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { TrendingUp, PieChart, Activity } from 'lucide-react';

const ROLE_META: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
    admin: { label: 'Chairperson', icon: Crown, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    secretary: { label: 'Secretary', icon: BookOpen, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    treasurer: { label: 'Treasurer', icon: Wallet, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    member: { label: 'Member', icon: User, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
};

export default function CommunityDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const groupId = params.id as string;

    const [activeTab, setActiveTab] = useState<'rotation' | 'members' | 'insights'>('rotation');
    const [members, setMembers] = useState<any[]>([]);
    const [myRole, setMyRole] = useState<string>('member');
    const [rotation, setRotation] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);


    // Start Rotation modal
    const [showStartModal, setShowStartModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [payoutDate, setPayoutDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Role promotion
    const [promotingMemberId, setPromotingMemberId] = useState<string | null>(null);
    const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
    const [disbursing, setDisbursing] = useState(false);

    // Contribution state
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [contribAmount, setContribAmount] = useState('');
    const [contribMethod, setContribMethod] = useState('momo');
    const [contribType, setContribType] = useState('regular');
    const [contribNotes, setContribNotes] = useState('');
    const [contribSubmitting, setContribSubmitting] = useState(false);

    const [swapRequests, setSwapRequests] = useState<any[]>([]);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [swapReason, setSwapReason] = useState('');
    const [swapSubmitting, setSwapSubmitting] = useState(false);

    // History State
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => { fetchData(); }, [groupId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const isLeader = ['admin', 'secretary'].includes(myRole);
            const calls: Promise<any>[] = [
                dashboardService.getGroupMemberList(groupId),
                rotationService.getRotationInfo(groupId),
                groupService.getGroupSummary(groupId),
                rotationService.getRotationHistory(groupId) // Fetch history unconditionally
            ];

            // Re-evaluating leadership after role is set, but for initial fetch we might need to wait or rely on member list
            // For now, let's just always try or check myRole if it's already available
            if (myRole === 'admin' || myRole === 'secretary') {
                calls.push(rotationService.getPendingRequests(groupId));
            }

            const results = await Promise.allSettled(calls);
            const [membersRes, rotRes, summaryRes, historyRes, swapRes] = results;

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

            if (membersRes.status === 'fulfilled') {
                const fetchedMembers = membersRes.value.data || [];
                setMembers(fetchedMembers);
                const role = membersRes.value.myRole || 'member';
                setMyRole(role);

                // If we didn't fetch swaps but we just found out we are a leader, fetch them now
                if ((role === 'admin' || role === 'secretary') && results.length < 4) {
                    rotationService.getPendingRequests(groupId).then(res => setSwapRequests(res.data)).catch(() => { });
                }
            }
            if (rotRes.status === 'fulfilled') setRotation(rotRes.value.data);
            if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data);
            if (historyRes && historyRes.status === 'fulfilled') setHistory(historyRes.value.data);
            if (swapRes && swapRes.status === 'fulfilled') setSwapRequests(swapRes.value.data);

        } catch (error: any) {
            console.error("fetchData unexpected error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartRotation = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await rotationService.startRotation(groupId, {
                amountPerMember: parseFloat(amount),
                payoutDate,
            });
            setShowStartModal(false);
            setAmount(''); setPayoutDate('');
            fetchData();
        } catch (error: any) {
            alert(error?.message || 'Failed to start rotation');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePromoteRole = async (memberId: string, newRole: string) => {
        setPromotingMemberId(memberId);
        setRoleDropdownOpen(null);
        try {
            await dashboardService.promoteRole(memberId, newRole);
            fetchData();
        } catch (error: any) {
            alert(error?.message || 'Failed to update role');
        } finally {
            setPromotingMemberId(null);
        }
    };

    const handleDisbursePayout = async () => {
        if (!window.confirm("Are you sure you want to disburse the pot to the current recipient and move to the next turn?")) return;
        setDisbursing(true);
        try {
            const res = await rotationService.disbursePayout(groupId);
            alert(res.message);
            fetchData();
        } catch (error: any) {
            alert(error?.message || 'Failed to disburse payout');
        } finally {
            setDisbursing(false);
        }
    };

    const handleContribute = async (e: React.FormEvent) => {
        e.preventDefault();
        setContribSubmitting(true);
        try {
            await savingService.recordContribution({
                groupId,
                amount: parseFloat(contribAmount),
                paymentMethod: contribMethod,
                type: contribType,
                notes: contribNotes,
            });
            setShowContributeModal(false);
            setContribAmount('');
            setContribNotes('');
            fetchData();
        } catch (error: any) {
            alert(error?.message || 'Failed to record contribution');
        } finally {
            setContribSubmitting(false);
        }
    };

    const handleRequestSwap = async (e: React.FormEvent) => {
        e.preventDefault();
        setSwapSubmitting(true);
        try {
            const res = await rotationService.requestSwap(groupId, swapReason);
            alert(res.message);
            setShowSwapModal(false);
            setSwapReason('');
            fetchData();
        } catch (error: any) {
            alert(error.message || 'Failed to submit swap request');
        } finally {
            setSwapSubmitting(false);
        }
    };

    const handleProcessSwap = async (requestId: string, action: 'approve' | 'reject') => {
        if (!window.confirm(`Are you sure you want to ${action} this emergency swap?`)) return;
        try {
            const res = await rotationService.handleSwapRequest(groupId, requestId, action);
            alert(res.message);
            fetchData();
        } catch (error: any) {
            alert(error.message || 'Failed to process request');
        }
    };

    const handleReorderQueue = async (memberId: string, direction: 'up' | 'down') => {
        try {
            await rotationService.reorderQueue(groupId, memberId, direction);
            fetchData();
        } catch (error: any) {
            alert(error.message || 'Failed to reorder queue');
        }
    };


    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 })
            .format(amt).replace('RWF', '').trim() + ' RWF';

    const isChairperson = myRole === 'admin';
    const isSecretary = myRole === 'secretary';
    const isLeader = ['admin', 'secretary', 'treasurer'].includes(myRole);
    const activeMembers = members.filter(m => m.status === 'active');

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium">{t('common.loading')}</span>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
            {/* Back + Header */}
            <button
                onClick={() => router.push('/dashboard/communities')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> {t('common.back')}
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t('communities.title')}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        {(() => {
                            const meta = ROLE_META[myRole];
                            const Icon = meta.icon;
                            return (
                                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border', meta.color, meta.bg, meta.border)}>
                                    <Icon className="w-3.5 h-3.5" /> {meta.label}
                                </span>
                            );
                        })()}
                        <span className="text-sm text-slate-500">{activeMembers.length} {t('communities.members')}</span>
                    </div>
                </div>
                {isChairperson && !rotation && activeMembers.length > 1 && (
                    <button
                        onClick={() => setShowStartModal(true)}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-600/20"
                    >
                        <Play className="w-4 h-4" /> {t('communities.start_rotation')}
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {(['rotation', 'members', 'insights'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            'px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap flex items-center gap-2.5',
                            activeTab === tab
                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                        )}
                    >
                        {tab === 'rotation' && (
                            <div className={cn("p-1.5 rounded-lg", activeTab === 'rotation' ? "bg-purple-100 text-purple-600" : "bg-slate-200 text-slate-500")}>
                                <Activity className="w-3.5 h-3.5" />
                            </div>
                        )}
                        {tab === 'members' && (
                            <div className={cn("p-1.5 rounded-lg", activeTab === 'members' ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-500")}>
                                <Users className="w-3.5 h-3.5" />
                            </div>
                        )}
                        {tab === 'insights' && (
                            <div className={cn("p-1.5 rounded-lg", activeTab === 'insights' ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-500")}>
                                <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                        )}

                        <span>
                            {tab === 'rotation' ? t('communities.rotation') :
                                tab === 'members' ? `${t('communities.members')} (${activeMembers.length})` :
                                    t('communities.insights')}
                        </span>
                    </button>
                ))}
            </div>

            {/* ────────────── ROTATION TAB ────────────── */}
            {activeTab === 'rotation' && (
                rotation ? (
                    <div className="space-y-6">
                        {/* Hero card - whose turn */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card className="bg-gradient-to-br from-purple-700 to-indigo-900 border-0 p-8 text-white relative overflow-hidden h-full">
                                    <div className="absolute right-0 top-0 opacity-10 p-8">
                                        <PiggyBank className="w-48 h-48" />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div>
                                            <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-sm">
                                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                                <span>{t('communities.active_cycle')}</span>
                                            </div>
                                            <p className="text-purple-200 font-medium mb-1">{t('communities.current_payout')}</p>
                                            <p className="text-5xl font-black mb-6 tracking-tight">{rotation.current_member_name}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-purple-500/30">
                                            <div>
                                                <p className="text-purple-200 text-xs uppercase tracking-wider font-semibold mb-1">{t('communities.total_pot')}</p>
                                                <p className="text-2xl font-bold">{formatCurrency((rotation.queue?.length || 0) * rotation.amount_per_member)}</p>
                                            </div>
                                            <div>
                                                <p className="text-purple-200 text-xs uppercase tracking-wider font-semibold mb-1">{t('communities.payout_date')}</p>
                                                <p className="text-2xl font-bold">{new Date(rotation.payout_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            <div>
                                <Card className="p-6 h-full flex flex-col">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                        <Clock className="w-5 h-5 text-emerald-500" /> {t('communities.progress')}
                                    </h3>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="text-center mb-6">
                                            <p className="text-sm text-slate-500 uppercase tracking-wider font-medium mb-2">Per Member</p>
                                            <p className="text-4xl font-extrabold text-slate-900">{formatCurrency(rotation.amount_per_member)}</p>
                                        </div>
                                        <div className="overflow-hidden h-3 rounded-full bg-slate-100">
                                            <div style={{ width: `${rotation.collection?.progressPercentage || 0}%` }} className="h-3 rounded-full bg-emerald-500 transition-all duration-1000" />
                                        </div>
                                        <p className="text-center text-xs text-slate-400 mt-2">
                                            {rotation.collection?.progressPercentage || 0}% collected
                                            <span className="block opacity-60 mt-1">
                                                ({formatCurrency(rotation.collection?.totalCollected || 0)} / {formatCurrency(rotation.collection?.expectedTotal || 0)})
                                            </span>
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-6">
                                        {isLeader && (
                                            <button
                                                onClick={handleDisbursePayout}
                                                disabled={disbursing}
                                                className="py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-slate-900/20">
                                                {disbursing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                {t('communities.disburse')}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setContribAmount(rotation.amount_per_member.toString());
                                                setShowContributeModal(true);
                                            }}
                                            className={cn(
                                                "py-3 border-2 border-slate-900 text-slate-900 hover:bg-slate-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm",
                                                !isLeader && "col-span-2"
                                            )}>
                                            <Plus className="w-4 h-4" />
                                            {t('communities.contribute')}
                                        </button>
                                        {/* Emergency Swap Trigger for Members */}
                                        {rotation.queue?.find((q: any) => q.user_id === user?.id)?.rotation_order > (rotation.queue?.find((q: any) => q.user_id === rotation.current_member_user_id)?.rotation_order || 0) && (
                                            <button
                                                onClick={() => setShowSwapModal(true)}
                                                className="col-span-2 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-black text-xs uppercase tracking-wider transition-all border border-red-100 mt-2 flex items-center justify-center gap-2"
                                            >
                                                <Activity className="w-3.5 h-3.5" />
                                                {t('communities.request_payout')}
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Pending Swap Requests (Leaders Only) */}
                        {swapRequests.length > 0 && (myRole === 'admin' || myRole === 'secretary') && (
                            <div className="space-y-3">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 ml-1">
                                    <Activity className="w-4 h-4 text-red-500" />
                                    {t('communities.active_requests')}
                                </h3>
                                {swapRequests.map((req) => (
                                    <Card key={req.id} className="p-4 border-red-200 bg-red-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black">
                                                {req.member_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{req.member_name}</p>
                                                <p className="text-xs text-slate-500 italic">" {req.reason} "</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleProcessSwap(req.id, 'reject')}
                                                className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-all"
                                            >
                                                {t('communities.reject_swap')}
                                            </button>
                                            <button
                                                onClick={() => handleProcessSwap(req.id, 'approve')}
                                                className="px-4 py-1.5 text-xs font-bold bg-red-600 text-white hover:bg-red-700 rounded-lg shadow-sm transition-all"
                                            >
                                                {t('communities.approve_swap')}
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Rotation Queue */}
                        <Card className="overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between">
                                <h3 className="font-bold text-slate-900">{t('communities.queue')}</h3>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full">{rotation.queue?.length || 0} {t('communities.members')}</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {rotation.queue?.map((m: any) => {
                                    const currentOrder = rotation.queue.find((q: any) => q.user_id === rotation.current_member_user_id)?.rotation_order || 999;
                                    const isCurrent = m.user_id === rotation.current_member_user_id;
                                    const isPast = m.rotation_order < currentOrder;
                                    return (
                                        <div key={m.member_id} className={cn('p-4 flex items-center justify-between', isCurrent && 'bg-purple-50')}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                                                    isCurrent ? 'bg-purple-600 text-white' : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                                                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : m.rotation_order}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{m.name} {m.user_id === user?.id && <span className="text-xs text-slate-400">(You)</span>}</p>
                                                    <p className="text-xs text-slate-500">{isCurrent ? 'Currently receiving' : isPast ? 'Already received' : 'Waiting'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Payment Status Badge */}
                                                <span className={cn(
                                                    'px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded border flex items-center gap-1',
                                                    m.has_paid
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                                )}>
                                                    {m.has_paid ? (
                                                        <><CheckCircle2 className="w-2.5 h-2.5" /> Paid</>
                                                    ) : (
                                                        <><Clock className="w-2.5 h-2.5" /> Pending</>
                                                    )}
                                                </span>

                                                <span className={cn('px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider',
                                                    isCurrent ? 'bg-purple-200 text-purple-700' : isPast ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                                                    {isCurrent ? 'Receiving' : isPast ? 'Done' : 'Waiting'}
                                                </span>

                                                {(isChairperson || isSecretary) && !isPast && !isCurrent && (
                                                    <div className="flex flex-col gap-0.5 ml-2 border-l border-slate-200 pl-2">
                                                        <button disabled={m.rotation_order - 1 <= currentOrder} onClick={() => handleReorderQueue(m.member_id, 'up')} className="p-0.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors">
                                                            <ArrowUp className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button disabled={m.rotation_order >= rotation.queue.length} onClick={() => handleReorderQueue(m.member_id, 'down')} className="p-0.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors">
                                                            <ArrowDown className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <Card className="p-16 text-center border-dashed border-2 bg-slate-50">
                            <PiggyBank className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Rotation</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">No Ikimina cycle is running. {isChairperson ? 'Start a new cycle to randomly shuffle members and begin payouts.' : 'Ask your Chairperson to start a rotation cycle.'}</p>
                            {isChairperson && activeMembers.length > 1 && (
                                <button onClick={() => setShowStartModal(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-purple-600/20">
                                    Start First Rotation
                                </button>
                            )}
                        </Card>

                        {/* Past Cycles History */}
                        <div className="space-y-4 pt-6">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                                {t('communities.cycle_history')}
                            </h3>
                            {history.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {history.map((cycle: any) => (
                                        <Card key={cycle.id} className="p-5 border-slate-200">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                        {t('communities.cycle_completed')}
                                                    </span>
                                                    <p className="text-sm text-slate-500 mt-2 font-medium">
                                                        {new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.completion_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('communities.pot_size')}</p>
                                                    <p className="font-black text-slate-900">{formatCurrency(cycle.amount_per_member * cycle.member_count)}</p>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-lg p-3">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500">{t('communities.members')}</p>
                                                        <p className="font-bold text-slate-700">{cycle.member_count}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Payouts</p>
                                                        <p className="font-bold text-slate-700">{cycle.payouts_made}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{t('communities.total_disbursed')}</p>
                                                    <p className="font-bold text-purple-700">{formatCurrency(cycle.total_disbursed || 0)}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic px-2">{t('communities.no_history')}</p>
                            )}
                        </div>
                    </div>
                )
            )}

            {activeTab === 'insights' && (
                <div className="space-y-6">
                    {/* Financial health summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-4 bg-white border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Group Balance</p>
                                <p className="text-xl font-black text-slate-900">{formatCurrency(summary?.currentBalance || 0)}</p>
                            </div>
                        </Card>
                        <Card className="p-4 bg-white border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <PiggyBank className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Contributions</p>
                                <p className="text-xl font-black text-slate-900">{formatCurrency(summary?.totalContributions || 0)}</p>
                            </div>
                        </Card>
                        <Card className="p-4 bg-white border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Loans</p>
                                <p className="text-xl font-black text-slate-900">{formatCurrency(summary?.totalLoansDisbursed - summary?.totalLoanRepayments || 0)}</p>
                            </div>
                        </Card>
                        <Card className="p-4 bg-white border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Penalties</p>
                                <p className="text-xl font-black text-slate-900">{formatCurrency(summary?.totalPenalties || 0)}</p>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Member Specific Insights */}
                        <Card className="p-6 bg-slate-900 text-white flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold opacity-60 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Your Personal Stats
                                </h3>
                                <div className="mt-8 space-y-6">
                                    <div>
                                        <p className="text-3xl font-black mb-1">{formatCurrency(summary?.myStats?.savings || 0)}</p>
                                        <p className="text-xs text-slate-400">Your total savings in this group</p>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 flex justify-between">
                                        <div>
                                            <p className="text-lg font-bold">{summary?.myStats?.activeLoans || 0}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active Loans</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-red-400">{formatCurrency(summary?.myStats?.penalties || 0)}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Unpaid Penalties</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {summary?.myStats?.penalties > 0 && (
                                <button
                                    onClick={() => {
                                        setContribAmount(summary.myStats.penalties.toString());
                                        setContribType('penalty');
                                        setContribNotes('Settling outstanding penalties');
                                        setShowContributeModal(true);
                                    }}
                                    className="mt-6 w-full py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-all">
                                    Pay Pending Fines
                                </button>
                            )}
                            <div className="mt-8 text-[10px] text-slate-500 leading-relaxed">
                                This feedback is updated in real-time based on your meeting attendance and contribution habits.
                            </div>
                        </Card>

                        {/* Visual Breakdown */}
                        <Card className="lg:col-span-2 p-6 overflow-hidden flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-800">Community Financial DNA</h3>
                                    <p className="text-xs text-slate-500">How resources are distributed within your group</p>
                                </div>
                                <PieChart className="w-5 h-5 text-slate-400" />
                            </div>

                            <div className="flex-1 flex flex-col justify-center space-y-8">
                                {[
                                    { label: 'Liquidity (Cash on hand)', val: summary?.currentBalance || 0, color: 'bg-emerald-500' },
                                    { label: 'Outsourced Loans', val: (summary?.totalLoansDisbursed - summary?.totalLoanRepayments) || 0, color: 'bg-blue-500' },
                                    { label: 'Penalties Received', val: summary?.totalPenalties || 0, color: 'bg-orange-500' },
                                ].map((item, idx) => {
                                    const total = (summary?.currentBalance || 0) + (summary?.totalLoansDisbursed - summary?.totalLoanRepayments || 0) + (summary?.totalPenalties || 0);
                                    const percentage = total === 0 ? 0 : Math.round((item.val / total) * 100);
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-center text-xs font-bold">
                                                <span className="text-slate-600">{item.label}</span>
                                                <span className="text-slate-900">{percentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={cn("h-full transition-all duration-1000", item.color)}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <p className="text-[10px] text-blue-800 font-medium">
                                    Official RCA Audit data. Secure and transparent ledger.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
            {activeTab === 'members' && (
                <Card className="overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">Community Members</h3>
                        {isChairperson && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Shield className="w-3.5 h-3.5 text-purple-500" />
                                <span>Tap a role badge to promote/demote</span>
                            </div>
                        )}
                    </div>
                    <div className="divide-y divide-slate-100">
                        {members.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">No members found.</div>
                        ) : members.map(member => {
                            const meta = ROLE_META[member.role] || ROLE_META.member;
                            const Icon = meta.icon;
                            const isMe = member.user_id === user?.id;
                            const isDropdownOpen = roleDropdownOpen === member.id;
                            const isPromoting = promotingMemberId === member.id;

                            return (
                                <div key={member.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className={cn('w-11 h-11 rounded-full flex items-center justify-center font-black text-lg',
                                            meta.bg, meta.color)}>
                                            {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {member.name}
                                                {isMe && <span className="ml-2 text-xs text-slate-400 font-normal">(You)</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">{member.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Status badge */}
                                        <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full',
                                            member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                                            {member.status}
                                        </span>

                                        {/* Role badge - clickable if chairperson and not self */}
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    if (isChairperson && !isMe) {
                                                        setRoleDropdownOpen(isDropdownOpen ? null : member.id);
                                                    }
                                                }}
                                                disabled={isPromoting}
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
                                                    meta.color, meta.bg, meta.border,
                                                    isChairperson && !isMe ? 'cursor-pointer hover:shadow-sm active:scale-95' : 'cursor-default'
                                                )}
                                            >
                                                {isPromoting ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Icon className="w-3.5 h-3.5" />
                                                )}
                                                {meta.label}
                                                {isChairperson && !isMe && <ChevronDown className="w-3 h-3 opacity-60" />}
                                            </button>

                                            {/* Dropdown */}
                                            {isDropdownOpen && (
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-900/10 z-50 overflow-hidden">
                                                    <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">Change Role To</p>
                                                    {Object.entries(ROLE_META).map(([role, roleMeta]) => {
                                                        const RIcon = roleMeta.icon;
                                                        return (
                                                            <button
                                                                key={role}
                                                                onClick={() => handlePromoteRole(member.id, role)}
                                                                disabled={member.role === role}
                                                                className={cn(
                                                                    'w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors',
                                                                    member.role === role ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:bg-slate-50',
                                                                )}
                                                            >
                                                                <RIcon className={cn('w-4 h-4', roleMeta.color)} />
                                                                <span className="font-semibold text-slate-700">{roleMeta.label}</span>
                                                                {member.role === role && <span className="ml-auto text-[10px] text-slate-400 font-medium">Current</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Click-away for dropdown */}
            {roleDropdownOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setRoleDropdownOpen(null)} />
            )}

            {/* Start Rotation Modal */}
            <Modal isOpen={showStartModal} onClose={() => !submitting && setShowStartModal(false)} title="Start Ikimina Cycle">
                <form onSubmit={handleStartRotation} className="space-y-5">
                    <p className="text-sm text-slate-500">All {activeMembers.length} active members will be randomly shuffled into a payout queue. The first person wins the pot!</p>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contribution Per Member</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">RWF</span>
                            <input type="number" required min="100" value={amount} onChange={e => setAmount(e.target.value)}
                                className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20"
                                placeholder="e.g. 10000" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Payout Date</label>
                        <input type="date" required value={payoutDate} onChange={e => setPayoutDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20" />
                    </div>

                    {amount && (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-1">Estimated Total Pot</p>
                            <p className="text-3xl font-black text-purple-700">{formatCurrency(parseFloat(amount || '0') * activeMembers.length)}</p>
                            <p className="text-xs text-purple-400 mt-1">{activeMembers.length} members × {formatCurrency(parseFloat(amount))}</p>
                        </div>
                    )}

                    <button type="submit" disabled={submitting || !amount || !payoutDate}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2">
                        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Shuffling Queue...</> : '🎲 Shuffle & Start Rotation'}
                    </button>
                </form>
            </Modal>

            {/* CONTRIBUTION MODAL */}
            <Modal isOpen={showContributeModal} onClose={() => !contribSubmitting && setShowContributeModal(false)} title={contribType === 'penalty' ? "Pay Outstanding Fine" : "Make Ikimina Contribution"}>
                <form onSubmit={handleContribute} className="space-y-4">
                    <div className={cn("border p-4 rounded-xl flex items-center gap-3 mb-2",
                        contribType === 'penalty' ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100")}>
                        <div className={cn("p-2 text-white rounded-lg",
                            contribType === 'penalty' ? "bg-red-500" : "bg-emerald-500")}>
                            {contribType === 'penalty' ? <Activity className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest",
                                contribType === 'penalty' ? "text-red-600" : "text-emerald-600")}>
                                {contribType === 'penalty' ? "Member Discipline" : "Current Payout Goal"}
                            </p>
                            <p className={cn("text-sm font-bold",
                                contribType === 'penalty' ? "text-red-900" : "text-emerald-900")}>
                                {contribType === 'penalty' ? "Clear your unpaid penalties" : `Contribution for ${rotation?.current_member_name}`}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (RWF)</label>
                        <input type="number" required value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['momo', 'cash', 'sacco'].map(method => (
                                <button key={method} type="button" onClick={() => setContribMethod(method)}
                                    className={cn("py-2.5 rounded-xl border font-bold capitalize text-xs tracking-wider transition-all",
                                        contribMethod === method ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}>
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                        <textarea value={contribNotes} onChange={e => setContribNotes(e.target.value)} placeholder="e.g. Monthly contribution"
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[80px]" />
                    </div>

                    <button type="submit" disabled={contribSubmitting || !contribAmount}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 mt-4">
                        {contribSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Recording...</> : 'Confirm Contribution'}
                    </button>
                </form>
            </Modal>

            {/* EMERGENCY SWAP MODAL */}
            <Modal isOpen={showSwapModal} onClose={() => !swapSubmitting && setShowSwapModal(false)} title="Request Emergency Payout">
                <form onSubmit={handleRequestSwap} className="space-y-4">
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                        <p className="text-red-800 text-sm font-bold flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4" />
                            Emergency Protocol
                        </p>
                        <p className="text-red-600/80 text-xs">
                            This will request the next payout pot immediately. If approved, you will swap places with the current recipient and occupy the end of the queue later.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Emergency</label>
                        <textarea
                            required
                            value={swapReason}
                            onChange={e => setSwapReason(e.target.value)}
                            placeholder="e.g. School fees, Medical bill, or Urgent investment..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 min-h-[120px] text-sm"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowSwapModal(false)}
                            className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={swapSubmitting || !swapReason}
                            className="flex-[2] py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {swapSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Request'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

