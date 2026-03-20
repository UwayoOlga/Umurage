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
    ArrowUpRight,
    Activity,
    MapPin,
    ArrowDownLeft,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [analytics, setAnalytics] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [risks, setRisks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect if not admin
        if (user && !isAdmin()) {
            router.push('/dashboard');
            return;
        }

        // Fetch data
        const fetchData = async () => {
            try {
                const [analyticsRes, activityRes, riskRes] = await Promise.all([
                    adminService.getAnalytics(),
                    adminService.getActivityFeed(10),
                    adminService.getRiskAnalysis()
                ]);
                setAnalytics(analyticsRes.data);
                setActivities(activityRes.data);
                setRisks(riskRes.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user && isAdmin()) {
            fetchData();
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

    const getOversightLevel = () => {
        if (user.admin_level === 'national') return 'National (All Rwanda)';
        return `${user.admin_level?.charAt(0).toUpperCase()}${user.admin_level?.slice(1)}: ${user.managed_location}`;
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'contribution': return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
            case 'loan_disbursement': return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
            case 'loan_repayment': return <ArrowDownLeft className="w-4 h-4 text-purple-600" />;
            default: return <Activity className="w-4 h-4 text-slate-600" />;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">System-wide overview and management</p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-semibold">Oversight: {getOversightLevel()}</span>
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
                    label="Total Savings balance"
                    value={`RWF ${parseInt(overall?.total_savings || '0').toLocaleString()}`}
                    icon={PiggyBank}
                    color="text-emerald-600"
                />
                <StatCard
                    label="Capital in Loans"
                    value={`${overall?.active_loan_count || 0}`}
                    icon={Banknote}
                    color="text-blue-600"
                    trend={`RWF ${parseInt(overall?.total_loans || '0').toLocaleString()} total`}
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>

                    {/* Activity Feed */}
                    <Card className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Live Invigilation Feed</h2>
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                                Real-time monitoring
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {activities.length > 0 ? (
                                activities.map((activity) => (
                                    <div key={activity.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                {getTransactionIcon(activity.type)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900">
                                                        {activity.from_member_name || 'System'}
                                                    </span>
                                                    <span className="text-slate-400 text-xs">
                                                        {activity.type.replace('_', ' ')} in
                                                    </span>
                                                    <span className="font-semibold text-emerald-700 text-sm">
                                                        {activity.group_name}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {new Date(activity.created_at).toLocaleString()} • {activity.sector}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900">
                                                RWF {parseInt(activity.amount).toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1 justify-end">
                                                {activity.status === 'completed' ? (
                                                    <>
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[10px] text-emerald-600 font-medium">Verified</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="w-3 h-3 text-amber-500" />
                                                        <span className="text-[10px] text-amber-600 font-medium">Pending</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <p>No recent activity detected in your oversight area.</p>
                                </div>
                            )}
                        </div>
                        {activities.length > 0 && (
                            <button className="w-full py-3 bg-slate-50 text-slate-500 text-xs font-semibold hover:text-emerald-600 transition-colors border-t border-slate-100">
                                VIEW ALL ACTIVITY
                            </button>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-6 bg-gradient-to-br from-emerald-800 to-emerald-900 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 opacity-50" />
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full uppercase tracking-wider">
                                Growth Stats
                            </span>
                        </div>
                        <h3 className="font-bold text-lg">Geographical Growth</h3>
                        <p className="text-emerald-100 text-sm mt-1 mb-6">
                            Insights for {getOversightLevel()}
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                <span className="text-sm text-emerald-200">New Users (30d)</span>
                                <span className="text-xl font-bold">+{recentActivity?.new_users_30d || 0}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                <span className="text-sm text-emerald-200">Active Members</span>
                                <span className="text-xl font-bold">{overall?.active_members || 0}</span>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                            <p className="text-[10px] text-emerald-300 font-bold uppercase mb-1">Regional Impact</p>
                            <div className="text-lg font-bold">
                                Healthy <span className="text-xs font-normal text-emerald-400 ml-1">98% repayment rate</span>
                            </div>
                        </div>
                    </Card>

                    {/* Risk Analysis Card */}
                    <Card className="p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                High-Risk Alerts
                            </span>
                            {risks.length > 0 && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                                    {risks.length} GROUPS FLAGED
                                </span>
                            )}
                        </h3>

                        <div className="space-y-4">
                            {risks.length > 0 ? (
                                risks.map((risk) => (
                                    <div key={risk.id} className="p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:border-red-200 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-900 group-hover:text-red-600 transition-colors">{risk.name}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${risk.risk_level === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                                                }`}>
                                                {risk.risk_level}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span className="flex items-center gap-0.5">
                                                <AlertCircle className="w-3 h-3 text-red-400" />
                                                {risk.overdue_loans} Overdue
                                            </span>
                                            <span>•</span>
                                            <span>{risk.penalty_count} Penalties</span>
                                        </div>
                                        <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${risk.risk_score > 70 ? 'bg-red-500' : 'bg-amber-500'
                                                    }`}
                                                style={{ width: `${risk.risk_score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 font-medium">All monitored groups are currently low-risk.</p>
                                </div>
                            )}
                        </div>

                        {risks.length > 0 && (
                            <button className="w-full mt-4 text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase transition-colors">
                                GENERATE SECTOR RISK REPORT
                            </button>
                        )}
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Policy Alerts
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-slate-200">
                                <p className="text-sm font-bold text-slate-800">Auto-Penalties Active</p>
                                <p className="text-xs text-slate-500">Users who miss rotation payouts are being fined RWF 500 automatically.</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <p className="text-sm font-bold text-blue-800">RCA Compliance</p>
                                <p className="text-xs text-blue-600 text-opacity-80">All groups in your sector must submit RCA registration numbers.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
