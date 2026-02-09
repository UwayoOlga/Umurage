import { PiggyBank } from "lucide-react";

export default function SavingsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <PiggyBank className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Savings Module</h1>
            <p className="text-slate-500 max-w-md mt-2">
                This feature is currently under development. Soon you'll be able to manage all group savings here.
            </p>
        </div>
    );
}
