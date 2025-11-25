'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/logo";

export function Navbar() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex h-16 items-center px-4 container mx-auto">
                <Link href="/" className="mr-8 hover:opacity-90 transition-opacity">
                    <Logo />
                </Link>
                {user && (
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
                )}
                <div className="ml-auto flex items-center space-x-4">
                    {loading ? (
                        <span className="text-sm text-muted-foreground">Loading...</span>
                    ) : user ? (
                        <>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                            <Button variant="ghost" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/login">Sign In</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/signup">Sign Up</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
