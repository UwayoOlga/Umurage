"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, Users, PiggyBank, Calendar, Play, Clock, CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { dashboardService } from '@/lib/services/dashboard.service';
import { rotationService } from '@/lib/services/rotation.service';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function CommunityDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, logout } = useAuth();
    const groupId = params.id as string;

    const [community, setCommunity] = useState<any>(null);
    const [rotation, setRotation] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showStartModal, setShowStartModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [payoutDate, setPayoutDate] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!groupId) return;
        fetchData();
    }, [groupId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // First we need to get community details. 
            // In a full app, we'd have a specific getGroupById endpoint. 
            // For now, we can fetch all and filter.
            const groupsRes = await dashboardService.getSummary(); // Or groupService.getMyGroups()
            // We use getGroupMembers to find out about members
            const membersRes = await dashboardService.getGroupMembers();

            const groupMembers = membersRes.data?.filter((m: any) => m.group_id === groupId) || [];
            setMembers(groupMembers);

            // Fetch rotation info
            try {
                const rotRes = await rotationService.getRotationInfo(groupId);
                setRotation(rotRes.data);
            } catch (rErr) {
                console.log("No active rotation or error parsing rotation:", rErr);
            }

        } catch (error: any) {
            if (error.message && error.message.toLowerCase().includes('token')) {
                logout();
            }
            console.error(error);
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
                payoutDate
            });
            setShowStartModal(false);
            fetchData();
        } catch (error: any) {
            alert(error?.response?.data?.error || "Failed to start rotation");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading community details...</div>;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-RW', {
            style: 'currency', currency: 'RWF', minimumFractionDigits: 0
        }).format(amount).replace('RWF', '').trim() + ' RWF';
    };

    const isLeader = members.some(m => m.user_id === user?.id && ['admin', 'secretary'].includes(m.role));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
            <button
                onClick={() => router.push('/dashboard/communities')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Communities
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        Community Details
                    </h1>
                    <p className="text-slate-500 mt-1">Manage operations and rotational cycles (Ikimina).</p>
                </div>
                {isLeader && !rotation && members.length > 0 && (
                    <button onClick={() => setShowStartModal(true)} className="btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-purple-600/20">
                        <Play className="w-4 h-4" /> Start New Rotation Cycle
                    </button>
                )}
            </div>

            {/* If there is an active rotation, show the dashboard! */}
            {rotation ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Whose turn is it? */}
                        <div className="lg:col-span-2">
                            <Card className="bg-gradient-to-br from-purple-700 to-indigo-900 border-0 p-8 text-white relative overflow-hidden h-full">
                                <div className="absolute right-0 top-0 opacity-10 p-8">
                                    <PiggyBank className="w-48 h-48" />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <div className="inline-flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-6 backdrop-blur-sm">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                            <span>Active Cycle (Ikimina)</span>
                                        </div>
                                        <h2 className="text-xl text-purple-100 font-medium mb-1">Current Payout Recipient</h2>
                                        <p className="text-5xl font-black mb-6 tracking-tight">{rotation.current_member_name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-purple-500/30">
                                        <div>
                                            <p className="text-purple-200 text-sm mb-1 uppercase tracking-wider font-semibold">Total Pot Size</p>
                                            <p className="text-2xl font-bold">{formatCurrency((rotation.queue?.length || 0) * rotation.amount_per_member)}</p>
                                        </div>
                                        <div>
                                            <p className="text-purple-200 text-sm mb-1 uppercase tracking-wider font-semibold">Payout Date</p>
                                            <p className="text-2xl font-bold flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-purple-300" />
                                                {new Date(rotation.payout_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Progress Tracker */}
                        <div className="lg:col-span-1">
                            <Card className="p-6 h-full flex flex-col">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                    <Clock className="w-5 h-5 text-emerald-500" /> Collection Progress
                                </h3>

                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="text-center mb-6">
                                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-2">Collected So Far</p>
                                        {/* Fake progress for demo purposes */}
                                        <p className="text-4xl font-extrabold text-slate-900">
                                            {formatCurrency(rotation.amount_per_member * Math.floor((rotation.queue?.length || 0) * 0.4))}
                                        </p>
                                        <p className="text-sm text-slate-400 mt-1">of {formatCurrency((rotation.queue?.length || 0) * rotation.amount_per_member)}</p>
                                    </div>

                                    <div className="relative pt-1">
                                        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100">
                                            <div style={{ width: "40%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000"></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                                            <span>0%</span>
                                            <span>40%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                </div>

                                {isLeader && (
                                    <button className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-lg shadow-slate-900/10">
                                        Disburse Pot Manually
                                    </button>
                                )}
                            </Card>
                        </div>
                    </div>

                    {/* Rotation Queue */}
                    <Card className="overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900">Rotation Queue</h3>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full">{rotation.queue?.length || 0} Members</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {rotation.queue?.map((member: any) => {
                                const isCurrent = member.user_id === rotation.current_member_user_id;
                                const isPast = member.rotation_order < (rotation.queue?.find((m: any) => m.user_id === rotation.current_member_user_id)?.rotation_order || 999);

                                return (
                                    <div key={member.member_id} className={cn(
                                        "p-4 flex items-center justify-between transition-colors",
                                        isCurrent ? "bg-purple-50" : "hover:bg-slate-50"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                                                isCurrent ? "bg-purple-600 text-white shadow-md shadow-purple-600/30" :
                                                    isPast ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {isPast ? <CheckCircle2 className="w-5 h-5" /> : member.rotation_order}
                                            </div>
                                            <div>
                                                <p className={cn("font-bold text-sm md:text-base", isCurrent ? "text-purple-900" : "text-slate-900")}>
                                                    {member.name} {member.user_id === user?.id && <span className="text-xs font-medium text-slate-400 ml-1">(You)</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {isCurrent ? "Currently receiving pot" : isPast ? "Already received pot" : "Waiting in queue"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn(
                                                "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full",
                                                isCurrent ? "bg-purple-200 text-purple-700" :
                                                    isPast ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {isCurrent ? 'Active Turn' : isPast ? 'Completed' : 'Pending'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            ) : (
                <Card className="p-12 text-center border-dashed border-2 bg-slate-50">
                    <PiggyBank className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Rotation</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">This community is not currently running an Ikimina rotation cycle. Admins can start a new cycle to randomly generate a queue for payouts.</p>
                </Card>
            )}

            {/* Start Rotation Modal */}
            <Modal isOpen={showStartModal} onClose={() => !submitting && setShowStartModal(false)} title="Start Ikimina Rotation">
                <form onSubmit={handleStartRotation} className="space-y-4">
                    <p className="text-sm text-slate-600 mb-4">Starting a rotation will randomly shuffle all active members and assign them a rotation order. The person with order #1 will receive the first payout.</p>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contribution Amount Form Each Member</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">RWF</span>
                            <input
                                type="number"
                                required
                                min="100"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none"
                                placeholder="e.g. 5000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">First Payout Date</label>
                        <input
                            type="date"
                            required
                            value={payoutDate}
                            onChange={e => setPayoutDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mt-6">
                        <h4 className="font-bold text-purple-900 text-sm mb-1">Total Pot Estimate</h4>
                        <p className="text-2xl font-black text-purple-700">
                            {amount ? formatCurrency(parseFloat(amount) * members.length) : 'RWF 0'}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">Based on {members.length} active members</p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !amount || !payoutDate}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-all mt-4"
                    >
                        {submitting ? "Generating Queue..." : "Shuffle & Start Rotation"}
                    </button>
                </form>
            </Modal>

        </div>
    );
}
