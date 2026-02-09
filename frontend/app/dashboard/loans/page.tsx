import { Banknote } from "lucide-react";

export default function LoansPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Banknote className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Loans Management</h1>
            <p className="text-slate-500 max-w-md mt-2">
                Track active loans, repayments, and interest. Coming soon!
            </p>
        </div>
    );
}
