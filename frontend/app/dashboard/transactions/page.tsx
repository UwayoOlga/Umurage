"use client";

import { useState } from "react";
import {
    History,
    Search,
    Filter,
    ArrowDownLeft,
    ArrowUpRight,
    Download
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Mock Data - Expanded
const TRANSACTIONS = [
    { id: 1, type: "Deposit", member: "Jean Uwimana", amount: "+50,000 RWF", date: "Feb 10, 2024, 10:00 AM", status: "Success", ref: "TXN-8821" },
    { id: 2, type: "Deposit", member: "Marie Mukamana", amount: "+20,000 RWF", date: "Feb 10, 2024, 09:15 AM", status: "Success", ref: "TXN-8820" },
    { id: 3, type: "Withdrawal", member: "Group Admin", amount: "-150,000 RWF", date: "Feb 09, 2024, 4:00 PM", status: "Pending", ref: "TXN-8819" },
    { id: 4, type: "Loan Issue", member: "Eric Mugisha", amount: "-200,000 RWF", date: "Feb 08, 2024, 2:30 PM", status: "Success", ref: "TXN-8818" },
    { id: 5, type: "Interest", member: "System", amount: "+2,400 RWF", date: "Feb 01, 2024, 12:00 AM", status: "Success", ref: "TXN-8810" },
    { id: 6, type: "Penalty", member: "Claude Ndayisaba", amount: "+1,000 RWF", date: "Jan 28, 2024, 11:45 AM", status: "Success", ref: "TXN-8805" },
];

export default function TransactionsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTxns = TRANSACTIONS.filter(t =>
        t.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ref.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <History className="w-6 h-6 text-emerald-600" />
                        Transactions
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Audit log of all financial activities.</p>
                </div>
                <button className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-sm font-medium flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Search & Filter Bar */}
            <Card className="p-1">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by member or reference ID..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-[1px] bg-slate-100"></div>
                    <button className="px-4 py-2 text-slate-500 hover:text-emerald-600 flex items-center gap-2 text-sm font-medium">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </Card>

            {/* Transactions Table */}
            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Reference</th>
                                <th className="px-6 py-4 font-medium">Member</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTxns.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900">{tx.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                        {tx.ref}
                                    </td>
                                    <td className="px-6 py-4 text-slate-700">
                                        {tx.member}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {tx.date}
                                    </td>
                                    <td className={cn("px-6 py-4 font-bold",
                                        tx.amount.startsWith('+') ? "text-emerald-700" : "text-slate-700"
                                    )}>
                                        {tx.amount}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                            tx.status === 'Success' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                "bg-amber-50 text-amber-700 border-amber-100"
                                        )}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
