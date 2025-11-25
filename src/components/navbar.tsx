import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <nav className="border-b">
            <div className="flex h-16 items-center px-4 container mx-auto">
                <Link href="/" className="font-bold text-xl mr-8">
                    SteadyLetters
                </Link>
                <div className="flex items-center space-x-4 lg:space-x-6 mx-6">
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/pricing"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Pricing
                    </Link>
                    <Link
                        href="/billing"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Billing
                    </Link>
                    <Link
                        href="/recipients"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Recipients
                    </Link>
                    <Link
                        href="/templates"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Templates
                    </Link>
                    <Link
                        href="/generate"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Generate
                    </Link>
                    <Link
                        href="/send"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Send
                    </Link>
                    <Link
                        href="/orders"
                        className="text-sm font-medium transition-colors hover:text-primary"
                    >
                        Orders
                    </Link>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <Button variant="ghost">Log out</Button>
                </div>
            </div>
        </nav>
    );
}
