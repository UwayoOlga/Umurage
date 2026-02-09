"use client";

import { useState } from "react";
import {
    Users,
    UserPlus,
    Search,
    MoreVertical,
    Phone,
    ShieldCheck,
    Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock Data
const MEMBERS = [
    { id: 1, name: "Jean Uwimana", role: "Admin", phone: "0788 123 456", status: "Active", joined: "Jan 2024", savings: "125,000 RWF" },
    { id: 2, name: "Marie Mukamana", role: "Treasurer", phone: "0788 876 543", status: "Active", joined: "Jan 2024", savings: "110,000 RWF" },
    { id: 3, name: "Claude Ndayisaba", role: "Member", phone: "0785 555 123", status: "Late Payment", joined: "Feb 2024", savings: "45,000 RWF" },
    { id: 4, name: "Alice Uwase", role: "Secretary", phone: "0783 333 999", status: "Active", joined: "Feb 2024", savings: "80,000 RWF" },
    { id: 5, name: "Eric Mugisha", role: "Member", phone: "0722 111 222", status: "Inactive", joined: "Mar 2024", savings: "10,000 RWF" },
    { id: 6, name: "Diane Keza", role: "Member", phone: "0799 444 777", status: "Active", joined: "Mar 2024", savings: "60,000 RWF" },
];

export default function MembersPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredMembers = MEMBERS.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-emerald-600" />
                        Group Members
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage access and view member details.</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Invite Member</span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex items-center gap-4 p-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Members</p>
                        <p className="text-2xl font-bold text-slate-900">24</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 p-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Admins & Leaders</p>
                        <p className="text-2xl font-bold text-slate-900">3</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 p-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pending Invites</p>
                        <p className="text-2xl font-bold text-slate-900">2</p>
                    </div>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                </button>
            </div>

            {/* Members List */}
            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Total Savings</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{member.name}</p>
                                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Phone className="w-3 h-3" /> {member.phone}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border",
                                            member.role === 'Admin' ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                member.role === 'Treasurer' ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                    member.role === 'Secretary' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                                                        "bg-slate-50 text-slate-600 border-slate-100"
                                        )}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                            member.status === 'Active' ? "bg-emerald-50 text-emerald-700" :
                                                member.status === 'Inactive' ? "bg-slate-100 text-slate-500" :
                                                    "bg-amber-50 text-amber-700"
                                        )}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full",
                                                member.status === 'Active' ? "bg-emerald-500" :
                                                    member.status === 'Inactive' ? "bg-slate-400" :
                                                        "bg-amber-500"
                                            )} />
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {member.savings}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredMembers.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                            <Search className="w-6 h-6" />
                        </div>
                        <h3 className="text-slate-900 font-medium">No members found</h3>
                        <p className="text-slate-500 text-sm mt-1">Try searching for a different name or phone number.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
