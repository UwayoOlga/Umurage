"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/services/admin.service';
import { StatCard, Card } from '@/components/ui/card';
import {
    Users,
    Layers,
    PiggyBank,
    Banknote,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect if not admin
        if (user && !isAdmin()) {
            router.push('/dashboard');
            return;
        }

        // Fetch analytics data
        const fetchAnalytics = async () => {
            try {
                const response = await adminService.getAnalytics();
                setAnalytics(response.data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user && isAdmin()) {
            fetchAnalytics();
        }
    }, [user, isAdmin, router]);

    if (!user || !isAdmin()) {
        return null;
    }

    if (loading) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const { overall, recentActivity } = analytics || {};

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">System-wide overview and management</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Users"
                    value={overall?.total_users || '0'}
                    icon={Users}
                    trend={`+${recentActivity?.new_users_30d || 0} this month`}
                    trendUp={true}
                />
                <StatCard
                    label="Active Groups"
                    value={overall?.total_groups || '0'}
                    icon={Layers}
                    color="text-purple-600"
                />
                <StatCard
                    label="Total Savings"
                    value={`RWF ${parseInt(overall?.total_savings || '0').toLocaleString()}`}
                    icon={PiggyBank}
                    color="text-emerald-600"
                />
                <StatCard
                    label="Active Loans"
                    value={`${overall?.active_loan_count || 0}`}
                    icon={Banknote}
                    color="text-blue-600"
                    trend={`RWF ${parseInt(overall?.total_loans || '0').toLocaleString()} total`}
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => router.push('/dashboard/admin/users')}
                    className="p-6 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-lg transition-all group text-left"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">User Management</h3>
                            <p className="text-sm text-slate-500 mt-1">View and manage all users</p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                </button>

                <button
                    onClick={() => router.push('/dashboard/admin/groups')}
                    className="p-6 bg-white border border-slate-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all group text-left"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">Groups Overview</h3>
                            <p className="text-sm text-slate-500 mt-1">Monitor all savings groups</p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                </button>

                <Card className="p-6 bg-gradient-to-br from-emerald-800 to-emerald-900 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <TrendingUp className="w-8 h-8" />
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                            Growth
                        </span>
                    </div>
                    <h3 className="font-bold text-lg">System Growth</h3>
                    <p className="text-emerald-100 text-sm mt-1 mb-4">
                        +{recentActivity?.new_users_7d || 0} users this week
                    </p>
                    <div className="text-2xl font-bold">
                        {overall?.active_members || 0} <span className="text-sm font-normal text-emerald-200">active members</span>
                    </div>
                </Card>
            </div>

            {/* Recent Activity Placeholder */}
            <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">System Activity</h2>
                <div className="text-center py-8 text-slate-500">
                    <p>Recent system-wide activity will appear here</p>
                </div>
            </Card>
        </div>
    );
}
