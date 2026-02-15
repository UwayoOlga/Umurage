"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/services/admin.service';
import { Card } from '@/components/ui/card';
import { Users, Search, ChevronDown } from 'lucide-react';

interface User {
    id: string;
    phone: string;
    name: string;
    role: string;
    created_at: string;
}

export default function UserManagement() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    useEffect(() => {
        if (user && !isAdmin()) {
            router.push('/dashboard');
            return;
        }

        fetchUsers();
    }, [user, isAdmin, router, search, roleFilter]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminService.getUsers(1, 50, search, roleFilter);
            setUsers(response.data.users);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await adminService.updateUserRole(userId, newRole);
            setEditingUserId(null);
            fetchUsers();
        } catch (error: any) {
            alert(error.message || 'Failed to update role');
        }
    };

    if (!user || !isAdmin()) {
        return null;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                <p className="text-slate-500 text-sm mt-1">View and manage all system users</p>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="treasurer">Treasurer</option>
                        <option value="secretary">Secretary</option>
                        <option value="member">Member</option>
                    </select>
                </div>
            </Card>

            {/* Users Table */}
            <Card className="overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Joined
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {users.map((userItem) => (
                                    <tr key={userItem.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{userItem.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {userItem.phone}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingUserId === userItem.id ? (
                                                <select
                                                    defaultValue={userItem.role}
                                                    onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                                                    onBlur={() => setEditingUserId(null)}
                                                    autoFocus
                                                    className="px-3 py-1 border border-emerald-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="treasurer">Treasurer</option>
                                                    <option value="secretary">Secretary</option>
                                                </select>
                                            ) : (
                                                <button
                                                    onClick={() => setEditingUserId(userItem.id)}
                                                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                    {userItem.role}
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(userItem.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
