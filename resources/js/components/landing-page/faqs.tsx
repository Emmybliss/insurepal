import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function FAQSection() {
    const faqs = [
        {
            id: 'item-1',
            question: 'What is included in each subscription plan?',
            answer: 'Each plan includes core insurance operations: Claims Management, Customer/Client Management, Quotes, Policy Management, Renewals Tracking, and Financial Notes (Receipts, Debit, Credit Notes). Higher plans unlock advanced features like Document Designer, Analytics, Stakeholder Ecosystem, Multi-language support, and API/Widget access.',
        },
        {
            id: 'item-2',
            question: 'Can I change my plan later?',
            answer: 'Yes! You can upgrade or downgrade your plan at any time from your account settings. Changes take effect on your next billing cycle and any unused portion of your current plan may be applied as credit.',
        },
        {
            id: 'item-3',
            question: 'What is the setup fee for, and is it mandatory?',
            answer: 'The setup fee applies to Guided Onboarding only — where our team personally configures your company workspace, sets up staff accounts, imports your data, and guides you through the platform live. Self-Onboarding is completely free and gives you access to all tutorials, documentation, and standard support. The choice is yours.',
        },
        {
            id: 'item-4',
            question: 'What is the difference between Self-Onboarding and Guided Onboarding?',
            answer: 'Self-Onboarding: Free. You configure everything at your own pace using our tutorials, documentation, and standard support. Guided Onboarding (Paid Setup Fee): Our team handles company configuration, staff account setup, data import assistance, workflow guidance, and a live onboarding session — so you are fully operational from day one.',
        },
        {
            id: 'item-5',
            question: 'Is InsurePal built specifically for Nigerian insurance brokers?',
            answer: 'Yes. InsurePal is designed around real Nigerian insurance workflows — including how brokers, underwriters, and agencies actually operate. It reflects local processes, not foreign assumptions. Currency is displayed in Naira (₦), and the platform supports Nigerian compliance requirements.',
        },
        {
            id: 'item-6',
            question: 'How does renewal tracking work?',
            answer: 'InsurePal automatically tracks the expiry dates of every policy in your system. As renewal dates approach, the platform surfaces them in your dashboard and triggers automated reminder notifications — so you can follow up with clients proactively instead of reacting after the fact.',
        },
        {
            id: 'item-7',
            question: 'How much storage do I get, and what counts toward it?',
            answer: 'Starter plans include 5GB of secure cloud storage, Professional plans include 20GB, and Enterprise plans include 100GB with expandable add-ons. Storage is used by uploaded documents, certificates, logos, and generated PDFs.',
        },
        {
            id: 'item-8',
            question: 'Is my data secure?',
            answer: 'Yes. InsurePal stores your data in secure, encrypted cloud infrastructure. Data is backed up regularly, reducing risk of loss from device failures or local system issues. All payments are processed securely through Paystack.',
        },
        {
            id: 'item-9',
            question: 'What payment methods do you accept?',
            answer: 'We accept all major payment methods through Paystack — including debit/credit cards, bank transfers, and USSD. All payments are encrypted and processed securely.',
        },
    ];

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <h2 className="mb-2 text-center text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="mb-10 text-center text-muted-foreground">Everything you need to know before getting started.</p>

            <Accordion type="single" collapsible className="w-full space-y-2">
                {faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left text-base font-medium">{faq.question}</AccordionTrigger>
                        <AccordionContent className="leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
