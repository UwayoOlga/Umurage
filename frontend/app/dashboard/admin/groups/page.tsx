"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/services/admin.service';
import { Card } from '@/components/ui/card';
import { Layers, Search, Users, PiggyBank } from 'lucide-react';

interface Group {
    id: string;
    name: string;
    contribution_amount: number;
    contribution_frequency: string;
    model_type: string;
    admin_name: string;
    member_count: number;
    total_savings: number;
    active_loans: number;
    created_at: string;
}

export default function GroupsOverview() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user && !isAdmin()) {
            router.push('/dashboard');
            return;
        }

        fetchGroups();
    }, [user, isAdmin, router, search]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await adminService.getGroups(1, 50, search);
            setGroups(response.data.groups);
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user || !isAdmin()) {
        return null;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Groups Overview</h1>
                <p className="text-slate-500 text-sm mt-1">Monitor all savings groups in the system</p>
            </div>

            {/* Search */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search groups by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
            </Card>

            {/* Groups Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl"></div>
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <Card className="p-8 text-center text-slate-500">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No groups found</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                        <Card key={group.id} className="p-6 hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full uppercase">
                                    {group.model_type}
                                </span>
                            </div>

                            <h3 className="font-bold text-lg text-slate-900 mb-1">{group.name}</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Admin: {group.admin_name || 'N/A'}
                            </p>

                            <div className="space-y-2 border-t border-slate-100 pt-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <Users className="w-4 h-4" />
                                        Members
                                    </span>
                                    <span className="font-semibold text-slate-900">{group.member_count}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-slate-600">
                                        <PiggyBank className="w-4 h-4" />
                                        Total Savings
                                    </span>
                                    <span className="font-semibold text-emerald-700">
                                        RWF {parseInt(String(group.total_savings || 0)).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Active Loans</span>
                                    <span className="font-semibold text-blue-700">{group.active_loans}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                                Created {new Date(group.created_at).toLocaleDateString()}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
