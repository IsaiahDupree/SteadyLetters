'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/logo";

export function Navbar() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <>
            <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex h-16 items-center px-4 container mx-auto">
                    <Link href="/" className="mr-8 hover:opacity-90 transition-opacity">
                        <Logo />
                    </Link>

                    {/* Desktop Navigation Links - Hidden on Mobile */}
                    {user && (
                        <div className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
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
                                href="/send/bulk"
                                className="text-sm font-medium transition-colors hover:text-primary"
                            >
                                Bulk Send
                            </Link>
                            <Link
                                href="/send/csv"
                                className="text-sm font-medium transition-colors hover:text-primary"
                            >
                                CSV Upload
                            </Link>
                            <Link
                                href="/orders"
                                className="text-sm font-medium transition-colors hover:text-primary"
                            >
                                Orders
                            </Link>
                            <Link
                                href="/analytics"
                                className="text-sm font-medium transition-colors hover:text-primary"
                            >
                                Analytics
                            </Link>
                            <Link
                                href="/account"
                                className="text-sm font-medium transition-colors hover:text-primary"
                            >
                                Account
                            </Link>
                        </div>
                    )}

                    {/* Desktop Auth Buttons */}
                    <div className="ml-auto hidden md:flex items-center space-x-4">
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

                    {/* Mobile Hamburger Menu Button */}
                    <button
                        className="ml-auto md:hidden p-2 hover:bg-accent rounded-md transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <X className="h-6 w-6" />
                        ) : (
                            <Menu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />
            )}

            {/* Mobile Menu Slide-out Panel */}
            <div
                className={`fixed top-16 right-0 bottom-0 w-72 bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full overflow-y-auto">
                    {/* User Info Section */}
                    {user && (
                        <div className="p-4 border-b">
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                    )}

                    {/* Navigation Links */}
                    {user && (
                        <nav className="flex-1 p-4 space-y-2">
                            <Link
                                href="/dashboard"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/pricing"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Pricing
                            </Link>
                            <Link
                                href="/billing"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Billing
                            </Link>
                            <Link
                                href="/recipients"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Recipients
                            </Link>
                            <Link
                                href="/templates"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Templates
                            </Link>
                            <Link
                                href="/generate"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Generate
                            </Link>
                            <Link
                                href="/send"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Send
                            </Link>
                            <Link
                                href="/send/bulk"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Bulk Send
                            </Link>
                            <Link
                                href="/send/csv"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                CSV Upload
                            </Link>
                            <Link
                                href="/orders"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Orders
                            </Link>
                            <Link
                                href="/analytics"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Analytics
                            </Link>
                            <Link
                                href="/account"
                                onClick={closeMobileMenu}
                                className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent rounded-md"
                            >
                                Account
                            </Link>
                        </nav>
                    )}

                    {/* Auth Buttons for Mobile */}
                    <div className="p-4 border-t space-y-2">
                        {loading ? (
                            <span className="text-sm text-muted-foreground">Loading...</span>
                        ) : user ? (
                            <Button
                                variant="ghost"
                                onClick={handleSignOut}
                                className="w-full"
                            >
                                Sign Out
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    asChild
                                    className="w-full"
                                >
                                    <Link href="/login" onClick={closeMobileMenu}>Sign In</Link>
                                </Button>
                                <Button
                                    asChild
                                    className="w-full"
                                >
                                    <Link href="/signup" onClick={closeMobileMenu}>Sign Up</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
