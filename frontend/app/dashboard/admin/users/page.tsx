"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/lib/services/admin.service';
import { Card } from '@/components/ui/card';
import { Users, Search, ChevronDown, UserPlus, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';

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

    // Invite Admin State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteData, setInviteData] = useState({
        name: '',
        phone: '',
        email: '',
        adminLevel: 'sector',
        managedLocation: ''
    });
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);

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

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setInviting(true);
            await adminService.createAdminAccount(inviteData);
            setInviteSuccess(true);
            fetchUsers();
        } catch (error: any) {
            alert(error.message || 'Failed to invite admin');
        } finally {
            setInviting(false);
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

    const getAdminLevelLabel = (level: string) => {
        const labels: any = {
            'national': 'National (RCA)',
            'province': 'Province',
            'district': 'District',
            'sector': 'Sector (SACCO)',
            'none': 'None'
        };
        return labels[level] || level;
    };

    if (!user || !isAdmin()) {
        return null;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500 text-sm mt-1">View and manage all system users</p>
                </div>
                {user.admin_level === 'national' && (
                    <button
                        onClick={() => {
                            setInviteSuccess(false);
                            setInviteData({ name: '', phone: '', email: '', adminLevel: 'sector', managedLocation: '' });
                            setIsInviteModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-emerald-200"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Admin
                    </button>
                )}
            </div>

            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                title={inviteSuccess ? "Invitation Sent!" : "Invite New Administrator"}
            >
                {inviteSuccess ? (
                    <div className="space-y-6 py-4 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-slate-900 font-semibold text-lg mb-2">Email Sent to {inviteData.name}</h4>
                            <p className="text-slate-500 text-sm">
                                An official invitation email has been sent to <span className="font-semibold text-slate-700">{inviteData.email}</span>.
                                They will receive a secure link to activate their account and set their own password.
                            </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-left">
                            <p className="text-amber-800 text-xs font-medium">📌 No email address provided? Remind them to visit <span className="font-mono">/setup-account</span> and contact you for their token.</p>
                        </div>
                        <button
                            onClick={() => setIsInviteModalOpen(false)}
                            className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleInvite} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Jean Doe"
                                    value={inviteData.name}
                                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="07xxxxxxxx"
                                    value={inviteData.phone}
                                    onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                            <input
                                required
                                type="email"
                                placeholder="name@email.com"
                                value={inviteData.email}
                                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <p className="text-xs text-slate-400">The activation link will be delivered to this address.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Admin Level</label>
                                <select
                                    required
                                    value={inviteData.adminLevel}
                                    onChange={(e) => setInviteData({ ...inviteData, adminLevel: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-[42px]"
                                >
                                    <option value="sector">Sector (SACCO)</option>
                                    <option value="district">District</option>
                                    <option value="province">Province</option>
                                    <option value="national">National (RCA)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Location Name</label>
                                <input
                                    required={inviteData.adminLevel !== 'national'}
                                    disabled={inviteData.adminLevel === 'national'}
                                    type="text"
                                    placeholder={inviteData.adminLevel === 'national' ? 'Across Rwanda' : 'e.g. Nyarugenge'}
                                    value={inviteData.adminLevel === 'national' ? '' : inviteData.managedLocation}
                                    onChange={(e) => setInviteData({ ...inviteData, managedLocation: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsInviteModalOpen(false)}
                                className="flex-1 bg-white text-slate-700 py-2.5 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={inviting}
                                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                {inviting ? 'Sending Invitation...' : 'Send Invitation'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

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
