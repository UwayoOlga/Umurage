"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Layers,
    Search,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    UserCheck,
    Hourglass,
    Loader2,
    CalendarDays,
    Plus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { dashboardService } from "@/lib/services/dashboard.service";
import { groupService } from "@/lib/services/group.service";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CommunitiesPage() {
    const { logout } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'my_communities' | 'pending_requests'>('my_communities');
    const [searchTerm, setSearchTerm] = useState("");

    // Data
    const [myCommunities, setMyCommunities] = useState<any[]>([]);
    const [allMembers, setAllMembers] = useState<any[]>([]); // Members across my lead groups

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Store member ID being acted on

    // Join Community states
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [nationalId, setNationalId] = useState("");
    const [rcaNumber, setRcaNumber] = useState("");
    const [communityName, setCommunityName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<'join' | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [groupsRes, membersRes] = await Promise.all([
                groupService.getMyGroups(),
                dashboardService.getGroupMembers()
            ]);
            setMyCommunities(groupsRes.data || []);
            setAllMembers(membersRes.data || []);
        } catch (error: any) {
            if (error.message && error.message.toLowerCase().includes('token')) {
                logout(); // Automatically redirect to login
            } else {
                console.log("Error fetching data:", error); // Use .log instead of .error to prevent Next.js dev overlay
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Check if user is a leader in any of their communities
    const isLeaderInAny = myCommunities.some(c => c.member_status === 'active' && ['admin', 'secretary'].includes(c.role));

    // Pending requests are members belonging to a group where the CURRENT USER is a leader
    // For simplicity, we filter allMembers for status === 'pending', but strictly those in groups we lead
    const leadGroupIds = myCommunities.filter(c => ['admin', 'secretary'].includes(c.role)).map(c => c.id);
    const pendingRequests = allMembers.filter(m => m.status === 'pending' && leadGroupIds.includes(m.group_id));

    // Filter my communities locally
    const filteredCommunities = myCommunities.filter(c =>
        (c.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (c.rca_number?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    // Filter pending requests locally
    const filteredRequests = pendingRequests.filter(req =>
        (req.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (req.phone || "").includes(searchTerm)
    );

    const handleApprove = async (memberId: string) => {
        setActionLoading(memberId);
        try {
            await dashboardService.approveMember(memberId);
            await fetchData(); // Refresh
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (memberId: string) => {
        if (!window.confirm("Are you sure you want to reject and remove this request?")) return;
        setActionLoading(memberId);
        try {
            await dashboardService.rejectMember(memberId);
            await fetchData(); // Refresh
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(null);
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
                fetchData();
            }, 2000);
        } catch (error: any) {
            alert(error.message || "Failed to join community");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <Layers className="w-8 h-8 text-emerald-600 drop-shadow-sm" />
                        Communities Hub
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Manage your cooperative memberships and verifications.</p>
                </div>
                <button onClick={() => setShowJoinModal(true)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-sm">
                    <Plus className="w-4 h-4" />
                    Join a Community
                </button>
            </div>

            {/* Custom Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('my_communities')}
                    className={cn(
                        "pb-3 text-sm font-bold transition-all border-b-2",
                        activeTab === 'my_communities' ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        My Communities
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] ml-1">{myCommunities.length}</span>
                    </div>
                </button>

                {isLeaderInAny && (
                    <button
                        onClick={() => setActiveTab('pending_requests')}
                        className={cn(
                            "pb-3 text-sm font-bold transition-all border-b-2",
                            activeTab === 'pending_requests' ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Pending Requests
                            {pendingRequests.length > 0 && (
                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] ml-1">{pendingRequests.length}</span>
                            )}
                        </div>
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                    type="text"
                    placeholder={`Search ${activeTab === 'my_communities' ? 'communities by name or RCA...' : 'requests by member name...'}`}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tab Content: My Communities */}
            {activeTab === 'my_communities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-12 text-center text-slate-400 font-medium">Loading your communities...</div>
                    ) : filteredCommunities.length === 0 ? (
                        <div className="col-span-full py-12 text-center">
                            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-slate-900">No communities found</h3>
                            <p className="text-slate-500 text-sm mt-1">You haven't joined any communities or none matched your search.</p>
                        </div>
                    ) : (
                        filteredCommunities.map((community) => (
                            <Card key={community.id} className="p-6 border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                {/* Status Indicator Strip */}
                                <div className={cn("absolute top-0 left-0 w-full h-1.5",
                                    community.member_status === 'active' ? "bg-emerald-500" : "bg-amber-400"
                                )} />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                        {community.name.charAt(0)}
                                    </div>
                                    <span className={cn("px-2.5 py-1 flex items-center gap-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                                        community.member_status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                    )}>
                                        {community.member_status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Hourglass className="w-3.5 h-3.5" />}
                                        {community.member_status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{community.name}</h3>
                                <div className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-500 mb-4 tracking-tight">
                                    {community.rca_number || "NO RCA NUMBER"}
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-6 min-h-[40px]">
                                    {community.description || "No description provided for this community."}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                        <CalendarDays className="w-4 h-4 text-slate-400" />
                                        Joined {new Date(community.joined_at).getFullYear()}
                                    </div>
                                    <span className={cn("px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest border",
                                        community.role === 'admin' ? "border-purple-200 text-purple-700 bg-purple-50" :
                                            community.role === 'secretary' ? "border-indigo-200 text-indigo-700 bg-indigo-50" :
                                                "border-slate-200 text-slate-600 bg-slate-50"
                                    )}>
                                        {community.role}
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={() => router.push(`/dashboard/communities/${community.id}`)}
                                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2"
                                    >
                                        Manage Community
                                    </button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Tab Content: Pending Requests */}
            {activeTab === 'pending_requests' && (
                <div className="space-y-4">
                    <Card className="overflow-hidden border-slate-200/60 shadow-sm rounded-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-600">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Applicant Name</th>
                                        <th className="px-6 py-4 font-semibold">Community</th>
                                        <th className="px-6 py-4 font-semibold">Requested At</th>
                                        <th className="px-6 py-4 font-semibold text-right">Approval Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">Loading requests...</td></tr>
                                    ) : filteredRequests.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">No pending requests to review.</td></tr>
                                    ) : (
                                        filteredRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-amber-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                                                            {req.name ? req.name.charAt(0) : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{req.name}</p>
                                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{req.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-slate-700">
                                                    {req.group_name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-medium">
                                                    {new Date(req.joined_at).toLocaleDateString(undefined, {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={actionLoading === req.id}
                                                            className="p-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors"
                                                            title="Reject Request"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(req.id)}
                                                            disabled={actionLoading === req.id}
                                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                                                        >
                                                            {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                                            Admit
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

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
                        <p className="text-slate-500 mt-2">You are now pending admin approval.</p>
                    </div>
                ) : (
                    <form onSubmit={handleJoinSubmit} className="space-y-4">
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mb-4">
                            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Official Verification</p>
                            <p className="text-xs text-amber-700">Provide the RCA details to securely join an official community.</p>
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
