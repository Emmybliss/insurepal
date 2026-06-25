import { FAQSection } from '@/components/landing-page/faqs';
import { PricingPlans } from '@/components/pricing/pricing-plans';
import { FrontendLayout } from '@/layouts/frontend-layout/frontend-layout';
import { Head } from '@inertiajs/react';

interface Props {
    plans: any[];
    currentPlanId?: number | null;
}

export default function SelectPlan({ plans, currentPlanId }: Props) {
    return (
        <FrontendLayout>
            <Head title="Select Your Plan" />

            <section id="pricing" className="bg-gradient-subtle py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl">Simple, Transparent Pricing</h2>
                        <p className="text-xl text-muted-foreground">Choose the perfect plan for your insurance business</p>
                        <p className="mt-2 text-sm font-semibold text-primary">🎉 No hidden charges! </p>
                    </div>

                    {/* Reusable pricing component */}
                    <PricingPlans plans={plans} currentPlanId={currentPlanId} />

                    <div className="mt-12 text-center">
                        <p className="text-sm text-gray-600">🔒 Secure payment powered by Paystack • Cancel anytime • No hidden fees</p>
                    </div>

                    {/* FAQ */}
                    <div className="mx-auto mt-5 max-w-3xl">
                        <FAQSection />
                    </div>
                </div>
            </section>
        </FrontendLayout>
    );
}
