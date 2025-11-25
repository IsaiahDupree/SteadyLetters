import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Logo Image */}
            <Image
                src="/logo.png"
                alt="SteadyLetters Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
            />

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
