"use client";

import { useState, useEffect } from "react";
import {
    Calendar,
    Clock,
    MapPin,
    Plus,
    Play,
    CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { meetingService } from "@/lib/services/meeting.service";
import { groupService } from "@/lib/services/group.service";
import { useAuth } from "@/context/AuthContext";
export default function MeetingsPage() {
    const { isAdmin, logout } = useAuth();

    const [meetings, setMeetings] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const ledGroups = groups.filter(g => ['admin', 'secretary', 'treasurer'].includes(g.role));
    const isLeaderOfAnyGroup = ledGroups.length > 0;

    // Modal state
    const [isScheduling, setIsScheduling] = useState(false);
    const [formData, setFormData] = useState({
        group_id: '',
        scheduled_for_date: '',
        scheduled_for_time: '',
        async_cutoff_time_date: '',
        async_cutoff_time_time: '',
        location: ''
    });

    const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
    const [attendanceList, setAttendanceList] = useState<any[]>([]);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [meetingsRes, groupsRes] = await Promise.all([
                meetingService.getMyMeetings(),
                groupService.getMyGroups()
            ]);
            setMeetings(meetingsRes.data || []);
            setGroups(groupsRes.data || []);
            if (groupsRes.data?.length > 0) {
                const led = groupsRes.data.filter((g: any) => ['admin', 'secretary', 'treasurer'].includes(g.role));
                if (led.length > 0) {
                    setFormData(prev => ({ ...prev, group_id: led[0].id }));
                }
            }
        } catch (error: any) {
            if (error.message && error.message.toLowerCase().includes('token')) {
                logout();
            } else {
                console.log("Error fetching data:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const scheduledFor = `${formData.scheduled_for_date}T${formData.scheduled_for_time}:00`;
            const asyncCutoff = `${formData.async_cutoff_time_date}T${formData.async_cutoff_time_time}:00`;

            await meetingService.scheduleMeeting(
                formData.group_id,
                scheduledFor,
                asyncCutoff,
                formData.location
            );
            setIsScheduling(false);
            fetchData();
        } catch (error: any) {
            console.error("Failed to schedule:", error);
            alert(error.message || "Failed to schedule meeting.");
        }
    };

    const handleStartMeeting = async (id: string, groupId: string) => {
        if (!confirm("Start this meeting? This will generate the agenda based on pending items.")) return;
        try {
            await meetingService.startMeeting(id);
            fetchData();
        } catch (error: any) {
            console.error("Error starting meeting", error);
            alert(error.message || "Error starting meeting.");
        }
    };

    const openAttendance = async (meeting: any) => {
        setSelectedMeeting(meeting);
        setIsAttendanceModalOpen(true);
        setLoadingAttendance(true);
        try {
            const res = await meetingService.getAttendance(meeting.id);
            setAttendanceList(res.data || []);
        } catch (error) {
            console.error("Error fetching attendance", error);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handleUpdateAttendance = async (memberId: string, status: string) => {
        if (!selectedMeeting) return;
        try {
            await meetingService.updateAttendance(selectedMeeting.id, memberId, status);
            // Update local state
            setAttendanceList(prev => prev.map(a => a.member_id === memberId ? { ...a, status } : a));
        } catch (error: any) {
            alert(error.message || "Failed to update attendance.");
        }
    };

    const groupMap = new Map();
    groups.forEach(g => groupMap.set(g.id, g.name));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-emerald-600" />
                        Group Meetings
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage async and sync sessions for your group.</p>
                </div>
                {isLeaderOfAnyGroup && (
                    <button onClick={() => setIsScheduling(true)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Schedule Meeting</span>
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-semibold text-slate-900">Upcoming & Recent Meetings</h3>
                    {loading ? (
                        <Card className="p-8 text-center text-slate-400">Loading meetings...</Card>
                    ) : meetings.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No Meetings Scheduled</h3>
                            <p className="text-slate-500 text-sm mb-4">You don't have any upcoming meetings right now.</p>
                            {isLeaderOfAnyGroup && (
                                <button onClick={() => setIsScheduling(true)} className="text-emerald-600 font-medium hover:underline text-sm">
                                    Schedule one now
                                </button>
                            )}
                        </Card>
                    ) : (
                        meetings.map((meeting) => (
                            <Card key={meeting.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-emerald-200 transition-colors">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full",
                                            meeting.status === 'SCHEDULED' ? "bg-amber-100 text-amber-700" :
                                                meeting.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer pointer-events-auto shadow-sm shadow-emerald-200/50" :
                                                    meeting.status === 'COMPLETED' ? "bg-slate-100 text-slate-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {meeting.status}
                                        </span>
                                        <span className="text-sm font-medium text-slate-600">
                                            {groupMap.get(meeting.group_id) || "Your Group"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                            {new Date(meeting.scheduled_for).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="w-4 h-4 text-emerald-500" />
                                            {new Date(meeting.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <MapPin className="w-4 h-4 text-emerald-500" />
                                            {meeting.location || "TBD"}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 text-xs">
                                            <span className="font-semibold uppercase truncate text-amber-500">Cut-off:</span>
                                            {new Date(meeting.async_cutoff_time).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5">
                                    {meeting.status === 'SCHEDULED' && groups.find(g => g.id === meeting.group_id) && ['admin', 'secretary', 'treasurer'].includes(groups.find(g => g.id === meeting.group_id).role) ? (
                                        <button
                                            onClick={() => handleStartMeeting(meeting.id, meeting.group_id)}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 font-medium text-sm transition-colors w-full md:w-auto"
                                        >
                                            Generate Agenda & Start
                                        </button>
                                    ) : meeting.status === 'ACTIVE' ? (
                                        <button
                                            onClick={() => openAttendance(meeting)}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm transition-colors w-full md:w-auto shadow-sm shadow-emerald-500/20"
                                        >
                                            {ledGroups.some(g => g.id === meeting.group_id) ? "Manage attendance" : "Join Sync"}
                                        </button>
                                    ) : (
                                        <button className="px-4 py-2 text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 font-medium text-sm transition-colors w-full md:w-auto">
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">How Meetings Work</h3>
                    <Card className="p-5 space-y-4 bg-emerald-50/50 border-emerald-100">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
                            <div>
                                <p className="font-medium text-emerald-900 text-sm">Pre-Meeting (Async)</p>
                                <p className="text-xs text-emerald-700 mt-1">Submit savings and vote on loans in the app before the cut-off time.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
                            <div>
                                <p className="font-medium text-emerald-900 text-sm">Smart Agenda</p>
                                <p className="text-xs text-emerald-700 mt-1">App automatically tallies votes and totals right before the start time.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
                            <div>
                                <p className="font-medium text-emerald-900 text-sm">The Sync (30 Mins)</p>
                                <p className="text-xs text-emerald-700 mt-1">Review complex items, track attendance, and get back to business!</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Schedule Modal */}
            {isScheduling && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md bg-white shadow-xl shadow-slate-900/10 border-0">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Schedule Meeting</h2>
                            <button onClick={() => setIsScheduling(false)} className="text-slate-400 hover:text-slate-600">×</button>
                        </div>
                        <form onSubmit={handleSchedule} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
                                <select
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    value={formData.group_id}
                                    onChange={e => setFormData({ ...formData, group_id: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>-- Select a group --</option>
                                    {ledGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                                        value={formData.scheduled_for_date}
                                        onChange={e => setFormData({ ...formData, scheduled_for_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                                        value={formData.scheduled_for_time}
                                        onChange={e => setFormData({ ...formData, scheduled_for_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                <label className="block text-xs font-semibold uppercase text-amber-700 mb-2">Async Cut-off Deadline</label>
                                <p className="text-xs text-amber-600 mb-2">When do you want to stop accepting digital contributions and votes?</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border border-amber-200 bg-white rounded-lg outline-none focus:border-amber-500 text-sm"
                                        value={formData.async_cutoff_time_date}
                                        onChange={e => setFormData({ ...formData, async_cutoff_time_date: e.target.value })}
                                    />
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 border border-amber-200 bg-white rounded-lg outline-none focus:border-amber-500 text-sm"
                                        value={formData.async_cutoff_time_time}
                                        onChange={e => setFormData({ ...formData, async_cutoff_time_time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Community Hall or Zoom Link"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full btn-primary mt-2">
                                Schedule Meeting
                            </button>
                        </form>
                    </Card>
                </div>
            )}

            {/* Attendance Modal */}
            {isAttendanceModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl bg-white shadow-xl shadow-slate-900/10 border-0 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Attendance Roll Call</h2>
                                <p className="text-xs text-slate-500">{groupMap.get(selectedMeeting?.group_id)} • {new Date(selectedMeeting?.scheduled_for).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                            {loadingAttendance ? (
                                <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    Loading members...
                                </div>
                            ) : attendanceList.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">No members found for this meeting.</div>
                            ) : (
                                attendanceList.map((record) => (
                                    <div key={record.member_id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                                {record.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{record.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{record.role}</p>
                                            </div>
                                        </div>

                                        <div className="flex bg-slate-100 p-1 rounded-lg">
                                            {['PRESENT', 'ABSENT', 'EXCUSED'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => handleUpdateAttendance(record.member_id, status)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all",
                                                        record.status === status
                                                            ? status === 'PRESENT' ? "bg-emerald-500 text-white shadow-sm" :
                                                                status === 'ABSENT' ? "bg-red-500 text-white shadow-sm" :
                                                                    "bg-amber-500 text-white shadow-sm"
                                                            : "text-slate-500 hover:text-slate-700"
                                                    )}
                                                >
                                                    {status === 'PRESENT' ? 'Present' : status === 'ABSENT' ? 'Absent' : 'Excused'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsAttendanceModalOpen(false)}
                                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm"
                            >
                                Done
                            </button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
