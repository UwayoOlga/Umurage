import { Menu } from "lucide-react";

export default function MenuPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mb-4">
                <Menu className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">More Options</h1>
            <p className="text-slate-500 max-w-md mt-2">
                Additional menu items and improved mobile navigation coming soon.
            </p>
        </div>
    );
}
