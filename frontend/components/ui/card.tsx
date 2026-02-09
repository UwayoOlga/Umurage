import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-all hover:shadow-md",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: LucideIcon;
    color?: string;
}

export function StatCard({ label, value, trend, trendUp, icon: Icon, color = "text-emerald-600" }: StatCardProps) {
    return (
        <Card className="flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl bg-slate-50", color.replace('text-', 'bg-').replace('600', '50'))}>
                    <Icon className={cn("w-6 h-6", color)} />
                </div>
                {trend && (
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full",
                        trendUp ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">{label}</h3>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">{value}</p>
            </div>
        </Card>
    );
}
