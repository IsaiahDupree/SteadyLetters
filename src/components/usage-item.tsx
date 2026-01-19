'use client';

interface UsageItemProps {
    label: string;
    used: number;
    limit: number;
    percentage: number;
}

export function UsageItem({ label, used, limit, percentage }: UsageItemProps) {
    const formatLimit = (limit: number) => {
        return limit === -1 ? 'Unlimited' : limit.toString();
    };

    const isNearLimit = percentage >= 80;
    const isAtLimit = percentage >= 100;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm">{label}</span>
                <span className={`font-medium ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : ''}`}>
                    {used} / {formatLimit(limit)}
                </span>
            </div>
            {limit !== -1 && (
                <div className="w-full bg-secondary rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${
                            isAtLimit
                                ? 'bg-red-500'
                                : isNearLimit
                                    ? 'bg-yellow-500'
                                    : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                </div>
            )}
        </div>
    );
}


