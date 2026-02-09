import { History } from "lucide-react";

export default function TransactionsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <History className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
            <p className="text-slate-500 max-w-md mt-2">
                A complete log of all group activities will be available here.
            </p>
        </div>
    );
}
