import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

            <div className="prose prose-gray max-w-none space-y-6">
                <p className="text-muted-foreground">
                    <strong>Effective Date:</strong> November 25, 2024
                </p>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
                    <p>
                        Welcome to SteadyLetters ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>

                    <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Account Information:</strong> Email address, password</li>
                        <li><strong>Recipient Information:</strong> Names, addresses for letter delivery</li>
                        <li><strong>Letter Content:</strong> Text, voice recordings, images you upload</li>
                        <li><strong>Payment Information:</strong> Processed securely through Stripe</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Usage data and analytics</li>
                        <li>Device information and IP address</li>
                        <li>Cookies and similar technologies</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>To provide and maintain our service</li>
                        <li>To process your letter orders via Thanks.io</li>
                        <li>To generate AI-powered letter content using OpenAI</li>
                        <li>To process payments via Stripe</li>
                        <li>To communicate with you about your account</li>
                        <li>To improve our service and user experience</li>
                        <li>To comply with legal obligations</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Supabase:</strong> Database and authentication</li>
                        <li><strong>OpenAI:</strong> AI-powered letter generation and image analysis</li>
                        <li><strong>Thanks.io:</strong> Physical letter printing and mailing</li>
                        <li><strong>Stripe:</strong> Payment processing</li>
                        <li><strong>Vercel:</strong> Hosting and infrastructure</li>
                    </ul>
                    <p className="mt-4">
                        Each service has its own privacy policy governing how they handle your data.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
                    <p>
                        We implement appropriate technical and organizational measures to protect your personal data, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Encryption of data in transit (HTTPS/SSL)</li>
                        <li>Secure authentication via Supabase</li>
                        <li>Regular security audits</li>
                        <li>Access controls and monitoring</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Export your data</li>
                        <li>Opt-out of marketing communications</li>
                        <li>Withdraw consent at any time</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">7. Data Retention</h2>
                    <p>
                        We retain your personal data only for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
                    <p>
                        Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Policy</h2>
                    <p>
                        We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Effective Date."
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
                    <p>
                        If you have questions about this Privacy Policy, please contact us at:
                    </p>
                    <p className="mt-4">
                        <strong>Email:</strong> privacy@steadyletters.com
                    </p>
                </section>

                <div className="mt-12 pt-8 border-t">
                    <Link href="/" className="text-primary hover:underline">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
