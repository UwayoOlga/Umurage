"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Users, PiggyBank, Play, Clock, CheckCircle2,
    Crown, BookOpen, Wallet, User, ChevronDown, Shield, Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { dashboardService } from '@/lib/services/dashboard.service';
import { rotationService } from '@/lib/services/rotation.service';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

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
    const groupId = params.id as string;

    const [activeTab, setActiveTab] = useState<'rotation' | 'members'>('rotation');
    const [members, setMembers] = useState<any[]>([]);
    const [myRole, setMyRole] = useState<string>('member');
    const [rotation, setRotation] = useState<any>(null);
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

    useEffect(() => { fetchData(); }, [groupId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [membersRes, rotRes] = await Promise.allSettled([
                dashboardService.getGroupMemberList(groupId),
                rotationService.getRotationInfo(groupId),
            ]);

            if (membersRes.status === 'fulfilled') {
                setMembers(membersRes.value.data || []);
                setMyRole(membersRes.value.myRole || 'member');
            }
            if (rotRes.status === 'fulfilled') {
                setRotation(rotRes.value.data);
            }
        } catch (error: any) {
            if (error.message?.toLowerCase().includes('token')) logout();
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

    const formatCurrency = (amt: number) =>
        new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 })
            .format(amt).replace('RWF', '').trim() + ' RWF';

    const isChairperson = myRole === 'admin';
    const isLeader = ['admin', 'secretary', 'treasurer'].includes(myRole);
    const activeMembers = members.filter(m => m.status === 'active');

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-medium">Loading community...</span>
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
                <ArrowLeft className="w-4 h-4" /> Back to Communities
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Community Management</h1>
                    <div className="flex items-center gap-3 mt-2">
                        {(() => {
                            const meta = ROLE_META[myRole];
                            const Icon = meta.icon;
                            return (
                                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border', meta.color, meta.bg, meta.border)}>
                                    <Icon className="w-3.5 h-3.5" /> Your Role: {meta.label}
                                </span>
                            );
                        })()}
                        <span className="text-sm text-slate-500">{activeMembers.length} active members</span>
                    </div>
                </div>
                {isChairperson && !rotation && activeMembers.length > 1 && (
                    <button
                        onClick={() => setShowStartModal(true)}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-600/20"
                    >
                        <Play className="w-4 h-4" /> Start Rotation Cycle
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {(['rotation', 'members'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            'px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all',
                            activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        {tab === 'rotation' ? '🔄 Ikimina Rotation' : `👥 Members (${activeMembers.length})`}
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
                                                <span>Active Ikimina Cycle</span>
                                            </div>
                                            <p className="text-purple-200 font-medium mb-1">Current Payout Recipient</p>
                                            <p className="text-5xl font-black mb-6 tracking-tight">{rotation.current_member_name}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-purple-500/30">
                                            <div>
                                                <p className="text-purple-200 text-xs uppercase tracking-wider font-semibold mb-1">Total Pot</p>
                                                <p className="text-2xl font-bold">{formatCurrency((rotation.queue?.length || 0) * rotation.amount_per_member)}</p>
                                            </div>
                                            <div>
                                                <p className="text-purple-200 text-xs uppercase tracking-wider font-semibold mb-1">Payout Date</p>
                                                <p className="text-2xl font-bold">{new Date(rotation.payout_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                            <div>
                                <Card className="p-6 h-full flex flex-col">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                        <Clock className="w-5 h-5 text-emerald-500" /> Collection Progress
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
                                    {isLeader && (
                                        <button
                                            onClick={handleDisbursePayout}
                                            disabled={disbursing}
                                            className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                            {disbursing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Disburse Pot
                                        </button>
                                    )}
                                </Card>
                            </div>
                        </div>

                        {/* Rotation Queue */}
                        <Card className="overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between">
                                <h3 className="font-bold text-slate-900">Rotation Queue</h3>
                                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full">{rotation.queue?.length || 0} Members</span>
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
                                            <span className={cn('px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider',
                                                isCurrent ? 'bg-purple-200 text-purple-700' : isPast ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
                                                {isCurrent ? 'Active' : isPast ? 'Done' : 'Pending'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                ) : (
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
                )
            )}

            {/* ────────────── MEMBERS TAB ────────────── */}
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
        </div>
    );
}
