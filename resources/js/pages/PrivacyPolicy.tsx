import { FrontendLayout } from '@/layouts/frontend-layout/frontend-layout';

const PrivacyPolicy = () => {
    return (
        <FrontendLayout>
            <section className="bg-background py-20">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <h1 className="mb-8 text-4xl font-bold text-foreground">Privacy Policy</h1>

                    <div className="space-y-6 text-lg text-muted-foreground">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
                            <p>
                                Welcome to InsurePal. We respect your privacy and are committed to protecting your personal data. This privacy policy
                                will inform you as to how we look after your personal data when you visit our website and tell you about your privacy
                                rights and how the law protects you.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">2. Important Information and Who We Are</h2>
                            <p>
                                InsurePal is the controller and responsible for your personal data. We have appointed a data privacy manager who is
                                responsible for overseeing questions in relation to this privacy policy. If you have any questions, please contact us.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">3. The Data We Collect</h2>
                            <p>
                                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together
                                follows:
                            </p>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>Identity Data includes first name, maiden name, last name, username or similar identifier.</li>
                                <li>Contact Data includes billing address, delivery address, email address and telephone numbers.</li>
                                <li>Financial Data includes bank account and payment card details.</li>
                                <li>
                                    Transaction Data includes details about payments to and from you and other details of products and services you
                                    have purchased from us.
                                </li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">4. How We Use Your Personal Data</h2>
                            <p>
                                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the
                                following circumstances:
                            </p>
                            <ul className="list-disc space-y-2 pl-5">
                                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                                <li>
                                    Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental
                                    rights do not override those interests.
                                </li>
                                <li>Where we need to comply with a legal or regulatory obligation.</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">5. Data Security</h2>
                            <p>
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or
                                accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those
                                employees, agents, contractors and other third parties who have a business need to know.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold text-foreground">6. Contact Us</h2>
                            <p>
                                If you have any questions about this privacy policy or our privacy practices, please contact us at:
                                support@insurepal.app
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
};

export default PrivacyPolicy;
