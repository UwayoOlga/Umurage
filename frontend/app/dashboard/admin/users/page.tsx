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
    admin_level: string;
    managed_location: string;
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
    const [editData, setEditData] = useState<Partial<User>>({});

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

    const handleSave = async (userId: string) => {
        try {
            await adminService.updateUserSettings(userId, {
                role: editData.role,
                admin_level: editData.admin_level,
                managed_location: editData.managed_location
            });
            setEditingUserId(null);
            fetchUsers();
        } catch (error: any) {
            alert(error.message || 'Failed to update user');
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Admin Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Managed Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {users.map((userItem) => (
                                    <tr key={userItem.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{userItem.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{userItem.phone}</td>
                                        <td className="px-6 py-4">
                                            {editingUserId === userItem.id ? (
                                                <select
                                                    value={editData.role || userItem.role}
                                                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                                    className="px-2 py-1 border border-slate-200 rounded text-sm"
                                                >
                                                    <option value="member">Member</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="treasurer">Treasurer</option>
                                                    <option value="secretary">Secretary</option>
                                                </select>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 uppercase">
                                                    {userItem.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingUserId === userItem.id ? (
                                                <select
                                                    value={editData.admin_level || userItem.admin_level || 'none'}
                                                    onChange={(e) => setEditData({ ...editData, admin_level: e.target.value })}
                                                    className="px-2 py-1 border border-slate-200 rounded text-sm"
                                                >
                                                    <option value="none">None</option>
                                                    <option value="national">National (RCA)</option>
                                                    <option value="province">Province</option>
                                                    <option value="district">District</option>
                                                    <option value="sector">Sector (SACCO)</option>
                                                </select>
                                            ) : (
                                                <span className="text-sm text-slate-600 capitalize">
                                                    {userItem.admin_level || 'None'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingUserId === userItem.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.managed_location || userItem.managed_location || ''}
                                                    onChange={(e) => setEditData({ ...editData, managed_location: e.target.value })}
                                                    placeholder="Sector/District Name"
                                                    className="px-2 py-1 border border-slate-200 rounded text-sm w-32"
                                                />
                                            ) : (
                                                <span className="text-sm text-slate-600">
                                                    {userItem.managed_location || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(userItem.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {editingUserId === userItem.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleSave(userItem.id)} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm">Save</button>
                                                    <button onClick={() => setEditingUserId(null)} className="text-slate-400 hover:text-slate-600 text-sm">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setEditingUserId(userItem.id); setEditData(userItem); }} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">Edit</button>
                                            )}
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
