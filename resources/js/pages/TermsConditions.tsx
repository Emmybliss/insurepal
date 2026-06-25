import { FrontendLayout } from '@/layouts/frontend-layout/frontend-layout';

const TermsConditions = () => {
    return (
        <FrontendLayout>
            <section className="bg-background py-20">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <h1 className="mb-8 text-4xl font-bold text-foreground">Terms and Conditions</h1>

                    <div className="space-y-6 text-lg text-muted-foreground">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">1. Agreement to Terms</h2>
                            <p>
                                These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of
                                an entity ("you") and InsurePal ("we," "us" or "our"), concerning your access to and use of the InsurePal application
                                and website as well as any other media form, media channel, mobile website or mobile application related, linked, or
                                otherwise connected thereto (collectively, the "Site").
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">2. Intellectual Property Rights</h2>
                            <p>
                                Unless otherwise indicated, the Site and its entire contents, features, and functionality (including but not limited
                                to all information, software, text, displays, images, video, and audio, and the design, selection, and arrangement
                                thereof) are owned by us, our licensors, or other providers of such material and are protected by international
                                copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">3. User Representations</h2>
                            <p>By using the Site, you represent and warrant that:</p>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>All registration information you submit will be true, accurate, current, and complete.</li>
                                <li>
                                    You will maintain the accuracy of such information and promptly update such registration information as necessary.
                                </li>
                                <li>You have the legal capacity and you agree to comply with these Terms and Conditions.</li>
                                <li>You are not a minor in the jurisdiction in which you reside.</li>
                                <li>
                                    You will not access the Site through automated or non-human means, whether through a bot, script or otherwise.
                                </li>
                                <li>You will not use the Site for any illegal or unauthorized purpose.</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">4. Prohibited Activities</h2>
                            <p>
                                You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may
                                not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">5. Termination</h2>
                            <p>
                                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability,
                                under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of
                                the Terms.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">6. Limitation of Liability</h2>
                            <p>
                                In no event shall we, nor our directors, employees, partners, agents, suppliers, or affiliates, be liable for any
                                indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data,
                                use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the
                                Service.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">7. Changes to Terms</h2>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material
                                we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material
                                change will be determined at our sole discretion.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">8. Contact Us</h2>
                            <p>If you have any questions about these Terms, please contact us at: support@insurepal.app</p>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
};

export default TermsConditions;
