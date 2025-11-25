import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

            <div className="prose prose-gray max-w-none space-y-6">
                <p className="text-muted-foreground">
                    <strong>Effective Date:</strong> November 25, 2024
                </p>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using SteadyLetters ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
                    <p>
                        SteadyLetters provides an AI-powered platform for creating and sending personalized handwritten letters. Our Service includes:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>AI-powered letter generation using OpenAI GPT-4</li>
                        <li>Voice-to-text transcription for letter content</li>
                        <li>Image analysis for personalized card design</li>
                        <li>Physical letter printing and mailing via Thanks.io</li>
                        <li>Subscription-based access to premium features</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>

                    <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Account Creation</h3>
                    <p>
                        You must create an account to use our Service. You agree to:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Provide accurate and complete information</li>
                        <li>Maintain the security of your password</li>
                        <li>Be responsible for all activity under your account</li>
                        <li>Notify us immediately of unauthorized access</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Account Termination</h3>
                    <p>
                        We reserve the right to suspend or terminate your account for violation of these Terms or illegal activity.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Subscription Plans</h2>

                    <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Pricing Tiers</h3>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Free:</strong> Limited usage with basic features</li>
                        <li><strong>Pro ($9.99/month):</strong> Enhanced limits and email support</li>
                        <li><strong>Business ($29.99/month):</strong> Unlimited AI features and priority support</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Billing</h3>
                    <p>
                        Subscription fees are charged monthly via Stripe. You authorize us to charge your payment method on a recurring basis.
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Cancellation</h3>
                    <p>
                        You may cancel your subscription at any time. Access to premium features will continue until the end of your billing period.
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Refunds</h3>
                    <p>
                        We offer a 30-day money-back guarantee for new subscriptions. Refund requests must be submitted within 30 days of purchase.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">5. Usage Limits</h2>
                    <p>
                        Each subscription tier has specific usage limits for:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Letter generations per month</li>
                        <li>Image generations per month</li>
                        <li>Letters sent per month</li>
                        <li>Voice transcriptions per month</li>
                        <li>Image analyses per month</li>
                    </ul>
                    <p className="mt-4">
                        Limits reset on the first day of each calendar month.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">6. Acceptable Use</h2>
                    <p>You agree NOT to use our Service to:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Send illegal, harmful, or offensive content</li>
                        <li>Harass, abuse, or spam recipients</li>
                        <li>Violate intellectual property rights</li>
                        <li>Impersonate others or provide false information</li>
                        <li>Attempt to circumvent usage limits or security measures</li>
                        <li>Use automated systems to abuse the Service</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">7. Intellectual Property</h2>

                    <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Your Content</h3>
                    <p>
                        You retain ownership of content you create. By using our Service, you grant us a license to process your content to provide the Service.
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-3">7.2 AI-Generated Content</h3>
                    <p>
                        Content generated by AI (letters, images) is provided to you for your use. We do not claim ownership of AI-generated content.
                    </p>

                    <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Service Content</h3>
                    <p>
                        All Service features, design, and branding are owned by SteadyLetters and protected by copyright and trademark laws.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">8. Third-Party Services</h2>
                    <p>
                        Our Service relies on third-party providers:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>OpenAI:</strong> AI letter generation and image analysis</li>
                        <li><strong>Thanks.io:</strong> Physical letter printing and mailing</li>
                        <li><strong>Stripe:</strong> Payment processing</li>
                    </ul>
                    <p className="mt-4">
                        We are not responsible for issues with third-party services. Their terms and policies apply to their respective services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">9. Disclaimers</h2>
                    <p>
                        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Uninterrupted or error-free service</li>
                        <li>Accuracy of AI-generated content</li>
                        <li>Delivery of physical letters (handled by Thanks.io)</li>
                        <li>Availability of specific features</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">10. Limitation of Liability</h2>
                    <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, STEADYLETTERS SHALL NOT BE LIABLE FOR:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Indirect, incidental, or consequential damages</li>
                        <li>Loss of profits, data, or goodwill</li>
                        <li>Service interruptions or errors</li>
                        <li>Third-party service failures</li>
                    </ul>
                    <p className="mt-4">
                        Our total liability shall not exceed the amount you paid in the past 12 months.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">11. Indemnification</h2>
                    <p>
                        You agree to indemnify and hold SteadyLetters harmless from claims arising from your use of the Service or violation of these Terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">12. Changes to Terms</h2>
                    <p>
                        We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">13. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of the United States. Any disputes shall be resolved in the appropriate courts.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
                    <p>
                        For questions about these Terms, contact us at:
                    </p>
                    <p className="mt-4">
                        <strong>Email:</strong> support@steadyletters.com
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
