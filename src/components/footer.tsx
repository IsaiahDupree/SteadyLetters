import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/logo';

export function Footer() {
    return (
        <footer className="border-t py-8 mt-12 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <Link href="/" className="hover:opacity-90 transition-opacity">
                        <Logo className="scale-75" />
                    </Link>
                    <div className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} SteadyLetters. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link
                            href="/privacy"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
