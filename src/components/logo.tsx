import { Mail } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Icon Mark: 11-coded Envelope */}
            <div className="relative flex items-center justify-center w-8 h-8">
                {/* Two vertical bars (11 energy) */}
                <div className="absolute inset-0 flex justify-center gap-3">
                    <div className="w-0.5 h-full bg-primary/80 rounded-full"></div>
                    <div className="w-0.5 h-full bg-primary/80 rounded-full"></div>
                </div>
                {/* Envelope Icon */}
                <div className="relative z-10 bg-background p-0.5 rounded-sm">
                    <Mail className="w-5 h-5 text-secondary fill-secondary/20" />
                </div>
            </div>

            {/* Wordmark */}
            <div className="flex items-baseline">
                <span className="font-serif text-xl font-bold text-primary tracking-wide">
                    Steady
                </span>
                <span className="font-sans text-xl font-medium text-foreground ml-1">
                    Letters
                </span>
                {/* Gold Dot Accent */}
                <span className="w-1.5 h-1.5 bg-secondary rounded-full ml-0.5 mb-1"></span>
            </div>
        </div>
    );
}
