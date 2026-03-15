"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { groupService } from '@/lib/services/group.service';
import { RWANDA_LOCATIONS } from '@/lib/constants/locations';
import { Card } from '@/components/ui/card';
import {
    Layers,
    ArrowLeft,
    MapPin,
    ShieldCheck,
    Building2,
    Save,
    Loader2,
    Info
} from 'lucide-react';

export default function RegisterOfficialGroup() {
    const router = useRouter();
    const { user, isAdmin } = useAuth();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        rcaNumber: '',
        description: '',
        contributionAmount: '',
        contributionFrequency: 'monthly',
        modelType: 'ROSCA',
        saccoAccountNumber: '',
        saccoId: '',
        penaltyAmount: 500,
        province: '',
        district: '',
        sector: ''
    });

    useEffect(() => {
        if (user && !isAdmin()) {
            router.push('/dashboard');
        }
    }, [user, isAdmin, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await groupService.createGroup({
                ...formData,
                contributionAmount: parseFloat(formData.contributionAmount)
            });
            alert('Official RCA Community Registered Successfully');
            router.push('/dashboard/admin/groups');
        } catch (error: any) {
            alert(error.message || 'Failed to register group');
        } finally {
            setLoading(false);
        }
    };

    const handleLocationChange = (level: 'province' | 'district' | 'sector', value: string) => {
        if (level === 'province') {
            setFormData({ ...formData, province: value, district: '', sector: '' });
        } else if (level === 'district') {
            setFormData({ ...formData, district: value, sector: '' });
        } else {
            setFormData({ ...formData, sector: value });
        }
    };

    if (!user || !isAdmin()) return null;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        Official RCA Registration
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Onboard a new savings group into the national oversight system</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <Layers className="w-5 h-5 text-emerald-600" />
                        Community Identity
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Official Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. Abahujumugambi Cooperative"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">RCA Number</label>
                        <input
                            type="text"
                            required
                            value={formData.rcaNumber}
                            onChange={(e) => setFormData({ ...formData, rcaNumber: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
                            placeholder="RCA/2026/00123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24"
                            placeholder="Purpose of this savings group..."
                        />
                    </div>
                </Card>

                {/* Regional Tagging */}
                <Card className="p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        Geographic Scoping (SACCO Link)
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Province</label>
                        <select
                            required
                            value={formData.province}
                            onChange={(e) => handleLocationChange('province', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
                        >
                            <option value="">Select Province</option>
                            {RWANDA_LOCATIONS.provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                        <select
                            required
                            disabled={!formData.province}
                            value={formData.district}
                            onChange={(e) => handleLocationChange('district', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50"
                        >
                            <option value="">Select District</option>
                            {formData.province && (RWANDA_LOCATIONS.districts as any)[formData.province].map((d: string) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sector (Local SACCO Jurisdiction)</label>
                        <select
                            required
                            disabled={!formData.district}
                            value={formData.sector}
                            onChange={(e) => handleLocationChange('sector', e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none disabled:bg-slate-50"
                        >
                            <option value="">Select Sector</option>
                            {formData.district && ((RWANDA_LOCATIONS.sectors as any)[formData.district] || []).map((s: string) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </Card>

                {/* Financial Terms */}
                <Card className="p-6 space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                        SACCO Financial Details
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contribution</label>
                            <input
                                type="number"
                                required
                                value={formData.contributionAmount}
                                onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
                                placeholder="RWF"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                            <select
                                value={formData.contributionFrequency}
                                onChange={(e) => setFormData({ ...formData, contributionFrequency: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                            <select
                                value={formData.modelType}
                                onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
                            >
                                <option value="ROSCA">ROSCA (Rotation)</option>
                                <option value="ASCA">ASCA (Loans)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Penalty (Non-pay)</label>
                            <input
                                type="number"
                                value={formData.penaltyAmount}
                                onChange={(e) => setFormData({ ...formData, penaltyAmount: parseInt(e.target.value) })}
                                className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">SACCO Account Number</label>
                        <input
                            type="text"
                            value={formData.saccoAccountNumber}
                            onChange={(e) => setFormData({ ...formData, saccoAccountNumber: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 rounded-lg outline-none"
                            placeholder="000-0000-0000000"
                        />
                    </div>
                </Card>

                {/* Summary & Submit */}
                <div className="space-y-6">
                    <Card className="p-6 bg-slate-50 border-emerald-100">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">Review Registration</h4>
                                <p className="text-xs text-slate-600 mt-1">
                                    Registering this community will link its digital ledger to the {formData.sector || 'selected'} SACCO.
                                    A 100% digital audit trail will be maintained.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Finalize RCA Registration
                    </button>
                </div>
            </form>
        </div>
    );
}
