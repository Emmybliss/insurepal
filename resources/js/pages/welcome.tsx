import { FAQSection } from '@/components/landing-page/faqs';
import { PricingPlans } from '@/components/pricing/pricing-plans';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useFlashToast from '@/hooks/useFlashToast';
import { FrontendLayout } from '@/layouts/frontend-layout/frontend-layout';
import { SubscriptionPlan } from '@/types';
import { Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Bot,
    CheckCircle,
    ChevronRight,
    Clock,
    FileText,
    Globe,
    Headphones,
    RefreshCw,
    Rocket,
    Shield,
    // Star,
    TrendingUp,
    Users,
    XCircle,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    plans: SubscriptionPlan[];
}

const LandingPage = ({ plans }: Props) => {
    useFlashToast();
    const [demoForm, setDemoForm] = useState({ name: '', email: '', company: '', phone: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const features = [
        {
            icon: Users,
            title: 'Policy & Customer Management',
            description: 'Centralized database for customers, policies, quotes, and renewals — with intelligent search and filtering.',
        },
        {
            icon: FileText,
            title: 'Claims Management',
            description: 'Log, track, and manage claims end-to-end with status updates and linked policy visibility.',
        },
        {
            icon: Bot,
            title: 'Financial Notes & Billing',
            description: 'Generate receipts, debit notes, credit notes, and invoices professionally — all from one place.',
        },
        {
            icon: RefreshCw,
            title: 'Renewal Tracking & Automation',
            description: 'Automated renewal reminders keep you ahead of expiry dates. Never miss a renewal again.',
        },
        {
            icon: BarChart3,
            title: 'Analytics & Performance Reports',
            description: 'Real-time dashboards with operational summaries, advanced analytics, and compliance reporting.',
        },
        {
            icon: FileText,
            title: 'Document Designer',
            description: 'Canvas-based template designer for certificates, policy schedules, and branded documents.',
        },
        {
            icon: Globe,
            title: 'Stakeholder Ecosystem',
            description: 'Connect brokers, underwriters, and clients — sharing linked transactions and document visibility.',
        },
        {
            icon: Shield,
            title: 'Roles & Permissions Control',
            description: 'Full RBAC — assign staff roles, control access levels, and track team performance with precision.',
        },
    ];

    const steps = [
        {
            number: '01',
            title: 'After Sign Up',
            description: 'Create your company workspace, upload your logo & configure company details',
        },
        {
            number: '02',
            title: 'Create & Manage',
            description: 'Add customers and issue policies with our intuitive, purpose-built interface',
        },
        {
            number: '03',
            title: 'Automate & Track',
            description: 'Set up automated renewal reminders, follow-ups, and financial note generation',
        },
        {
            number: '04',
            title: 'Report & Analyze',
            description: 'Generate compliance reports, track performance metrics, and monitor revenue',
        },
    ];

    const personas = [
        {
            emoji: '🏢',
            title: 'Growing Insurance Brokers',
            description:
                'You manage dozens (or hundreds) of policies and want structure, automation, and visibility — not spreadsheets and reminders written on paper.',
        },
        {
            emoji: '🛡️',
            title: 'Underwriters Managing Multiple Products',
            description: 'You need centralized control over policies, renewals, documentation, and reporting without administrative chaos.',
        },
        {
            emoji: '👥',
            title: 'Insurance Agencies With Staff',
            description: 'You want role-based access, performance tracking, and accountability across your team.',
        },
        {
            emoji: '📈',
            title: 'Firms That Want to Scale',
            description: "You're planning to grow your portfolio and know manual systems won't survive increased volume.",
        },
        {
            emoji: '💰',
            title: 'Serious About Revenue Retention',
            description: 'You understand that missed renewals mean lost income — and you want automation protecting your cash flow.',
        },
        {
            emoji: '🧾',
            title: 'Firms That Want Better Compliance',
            description: 'You want cleaner reporting, organized records, and a system that prepares you for regulatory review.',
        },
    ];

    const whyChoose = [
        {
            number: '01',
            icon: Shield,
            title: 'Built Specifically for Insurance',
            description:
                "InsurePal is designed around real insurance workflows — policies, renewals, debit notes, receipts, reporting, and client tracking. This isn't a modified accounting tool. It's purpose-built for brokers and underwriters.",
        },
        {
            number: '02',
            icon: RefreshCw,
            title: 'Protects Your Renewal Revenue',
            description:
                'Missed renewals means lost income. InsurePal tracks policy expiration dates and helps you stay ahead — turning forgotten revenue into consistent cash flow. For many firms, this alone justifies the investment.',
        },
        {
            number: '03',
            icon: BarChart3,
            title: 'All Your Operations in One System',
            description:
                'No more switching between Excel sheets, paper files, WhatsApp messages, and email threads. InsurePal centralizes your clients, policies, transactions, and reports in one secure dashboard.',
        },
        {
            number: '04',
            icon: TrendingUp,
            title: 'Built for Growth',
            description:
                "Manual systems break as your portfolio grows. InsurePal scales with you — whether you're managing 50 policies or 5,000. Add staff accounts, track performance, and expand without increasing admin chaos.",
        },
        {
            number: '05',
            icon: Globe,
            title: 'Cloud-Based & Secure',
            description:
                'Access your system from anywhere. Your data is securely stored, backed up, and protected — reducing the risk of loss from damaged devices or local system failures.',
        },
        {
            number: '06',
            icon: Users,
            title: 'Local Workflow Understanding',
            description:
                'InsurePal is designed with the Nigerian insurance market in mind. It reflects how brokers and underwriters actually work — not foreign assumptions about your processes.',
        },
    ];

    const roiItems = [
        {
            icon: TrendingUp,
            label: 'Revenue Protection',
            stat: 'Capture More Renewals',
            detail: 'Automated renewal tracking keeps you ahead of expiry dates and follow-ups — protecting income you would otherwise lose.',
        },
        {
            icon: Clock,
            label: 'Time Savings',
            stat: 'Hours Recovered Weekly',
            detail: 'Stop manually searching for client files, formatting documents, and preparing reports. Structured systems save hours every week.',
        },
        {
            icon: Users,
            label: 'Staff Productivity',
            stat: 'Reduce Human Errors',
            detail: 'Structured systems reduce duplicate work, confusion between team members, and delays in client response.',
        },
        {
            icon: BarChart3,
            label: 'Operational Visibility',
            stat: 'Proactive Management',
            detail: 'Real-time dashboards and organized records let management monitor revenue trends, track staff activity, and make smarter decisions.',
        },
    ];

    const notForList = [
        'Brokers running insurance as a side hustle',
        'Firms unwilling to move away from manual record keeping',
        'Businesses looking for the cheapest software option',
        'Teams not ready to adopt a structured workflow',
    ];

    // const testimonials = [
    //     {
    //         name: 'Dr. Justina Anaetoh',
    //         company: 'Linking Insurance Brokers',
    //         avatar: 'JA',
    //         quote: "InsurePal transformed our operations. We've reduced processing time by 80% and our NAICOM compliance is now effortless.",
    //         rating: 5,
    //     },
    //     {
    //         name: 'Dr. Mrs. Bola Onigbogi',
    //         company: 'CBO Insurance Brokers',
    //         avatar: 'BO',
    //         quote: 'The document management and renewal tracking is incredibly accurate. Our team productivity improved significantly since implementing InsurePal.',
    //         rating: 5,
    //     },
    //     {
    //         name: 'Adebayo Okafor',
    //         company: 'Fortress Insurance Agency',
    //         avatar: 'AO',
    //         quote: 'Finally, an insurance platform built for Nigerian brokers. The renewal automation alone saves us hours every month.',
    //         rating: 5,
    //     },
    // ];

    const handleDemoSubmit = () => {
        if (!demoForm.name || !demoForm.email || !demoForm.company) return;
        setIsSubmitting(true);
        router.post(route('demo.request'), demoForm, {
            onFinish: () => setIsSubmitting(false),
            onError: () => setIsSubmitting(false),
        });
    };

    const fmtNGN = (amount: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

    return (
        <FrontendLayout>
            {/* ── Hero Section ── */}
            <section className="bg-gradient-subtle relative overflow-hidden py-10 lg:py-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Badge variant="outline" className="border-primary text-primary">
                                    <Zap className="mr-1 h-3 w-3" />
                                    Professional Insurance Management Ecosystem
                                </Badge>
                                <h1 className="text-4xl leading-tight font-bold text-foreground lg:text-6xl">
                                    Insurance Management <span className="text-primary">Built for Nigerian Brokers & Underwriters</span>
                                </h1>
                                <p className="text-xl leading-relaxed text-muted-foreground">
                                    Automate policies, renewals, document generation, client management, financial notes, and compliance reporting —
                                    all within one unified insurance ecosystem.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                <Link href={route('register')}>
                                    <Button size="lg" className="group">
                                        Get Started
                                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                                <a href="#pricing">
                                    <Button variant="outline" size="lg" className="group">
                                        View Pricing
                                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </a>
                            </div>

                            <div className="grid grid-cols-2 gap-8 pt-4 sm:grid-cols-3 lg:pt-8">
                                <div className="text-left">
                                    <div className="text-2xl font-bold text-foreground lg:text-3xl">500+</div>
                                    <div className="text-sm tracking-wider text-muted-foreground uppercase">Policies Managed</div>
                                </div>
                                <div className="text-left">
                                    <div className="text-2xl font-bold text-foreground lg:text-3xl">25+</div>
                                    <div className="text-sm tracking-wider text-muted-foreground uppercase">Active Agencies</div>
                                </div>
                                <div className="text-left">
                                    <div className="text-2xl font-bold text-foreground lg:text-3xl">99.9%</div>
                                    <div className="text-sm tracking-wider text-muted-foreground uppercase">Uptime</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <img
                                src="/images/insurepal-mockup.png"
                                alt="InsurePal Dashboard Mockup"
                                width={600}
                                height={400}
                                className="h-auto w-auto rounded-xl shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Section ── */}
            <section id="features" className="bg-background py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl">Everything You Need to Manage Insurance</h2>
                        <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
                            Comprehensive tools designed specifically for Nigerian insurance brokers and underwriters
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, idx) => (
                            <Card key={idx} className="group transition-smooth relative hover:shadow-lg">
                                <CardHeader>
                                    <div className="transition-smooth mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Visual Tour / Screenshots ── */}
            <section className="bg-gradient-subtle py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <Badge variant="outline" className="mb-4 border-primary text-primary">
                            <Zap className="mr-1 h-3 w-3" />
                            Visual Tour
                        </Badge>
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl">Take a Peek inside the Platform</h2>
                        <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
                            Clean, modern, and high-performance interfaces designed for maximum productivity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                        {/* Featured Large Screenshot */}
                        <div className="group relative overflow-hidden rounded-2xl border border-border shadow-2xl">
                            <img
                                src="/images/insurepal-dashboard-white.png"
                                alt="Main Operational Dashboard"
                                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <div className="text-white">
                                    <h4 className="text-xl font-bold">Comprehensive Analytics</h4>
                                    <p className="text-sm opacity-90">Track your business growth and policy performance in real-time.</p>
                                </div>
                            </div>
                        </div>

                        {/* Side Grid of Smaller Screenshots */}
                        <div className="grid grid-cols-1 gap-8">
                            <div className="flex flex-col items-center gap-6 sm:flex-row">
                                <div className="w-full flex-shrink-0 overflow-hidden rounded-xl border border-border shadow-lg sm:w-1/2">
                                    <img
                                        src="/images/insurepal-dashboard-black.png"
                                        alt="Broker's Interface"
                                        className="h-auto w-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-lg font-bold text-foreground">Underwriter and Broker Central</h4>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Empower Brokers and Underwriters with tools to manage clients, issue policies, and track commissions
                                        efficiently.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 sm:flex-row-reverse">
                                <div className="w-full flex-shrink-0 overflow-hidden rounded-xl border border-border shadow-lg sm:w-1/2">
                                    <img
                                        src="/images/insurepal-dashboard3.png"
                                        alt="Policy Management Screen"
                                        className="h-auto w-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <h4 className="text-left text-lg font-bold text-foreground sm:text-right lg:text-left">Policy Lifecycle</h4>
                                    <p className="text-left text-sm leading-relaxed text-muted-foreground sm:text-right lg:text-left">
                                        End-to-end management from quote to issuance, through renewals and claims.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Who InsurePal Is For ── */}
            <section id="who-its-for" className="bg-gradient-subtle py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <Badge variant="outline" className="mb-4 border-primary text-primary">
                            <Users className="mr-1 h-3 w-3" />
                            Ideal For
                        </Badge>
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl">
                            Built for Insurance Firms Ready to Operate Like Professionals
                        </h2>
                        <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
                            If you manage policies, serve clients, and need structure — InsurePal was built for you.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {personas.map((persona, idx) => (
                            <Card key={idx} className="border-border transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="mb-4 text-4xl">{persona.emoji}</div>
                                    <h3 className="mb-2 text-lg font-bold text-foreground">{persona.title}</h3>
                                    <p className="leading-relaxed text-muted-foreground">{persona.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Who It's NOT For */}
                    <div className="mt-12 rounded-xl border border-border bg-card p-8">
                        <h3 className="mb-6 text-xl font-bold text-foreground">
                            ❌ Who InsurePal Is <span className="text-destructive">Not</span> For
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            We are intentional about who we serve. InsurePal is not a fit for everyone — and that's by design.
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {notForList.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <XCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
                                    <span className="text-sm text-muted-foreground">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 border-t border-border pt-6">
                            <p className="text-sm font-semibold text-foreground italic">
                                "If you're building a serious insurance operation — not just managing policies casually — InsurePal was built for
                                you."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Why Choose InsurePal ── */}
            <section id="why-insurepal" className="bg-background py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl"> Why Choose InsurePal?</h2>
                        <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
                            Purpose-built for insurance professionals. Not a generic tool. Not an afterthought.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {whyChoose.map((item, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <item.icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <div className="mb-1 text-xs font-bold tracking-widest text-primary uppercase">{item.number}</div>
                                    <h3 className="mb-2 text-lg font-bold text-foreground">{item.title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
                        <p className="text-xl font-bold text-foreground"> Bottom Line</p>
                        <p className="mt-3 text-lg text-muted-foreground">
                            InsurePal isn't just software.
                            <br />
                            It's <span className="font-semibold text-foreground">operational control</span>,{' '}
                            <span className="font-semibold text-foreground">revenue protection</span>, and{' '}
                            <span className="font-semibold text-foreground">scalable structure</span> for serious insurance firms.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── ROI Section ── */}
            <section className="bg-gradient-subtle py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl">💰 InsurePal Is an Investment — Not an Expense</h2>
                        <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
                            If your firm manages 200 active policies and even 5 renewals are missed per year due to poor tracking — what is the
                            revenue lost? InsurePal pays for itself.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {roiItems.map((item, idx) => (
                            <Card key={idx} className="text-center transition-shadow hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                        <item.icon className="h-7 w-7 text-primary" />
                                    </div>
                                    <div className="mb-1 text-sm font-semibold tracking-wide text-primary uppercase">{item.label}</div>
                                    <div className="mb-3 text-lg font-bold text-foreground">{item.stat}</div>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-xl font-bold text-foreground">
                            If InsurePal helps you capture more renewals, reduce admin workload, and prevent revenue leakage…
                        </p>
                        <p className="mt-3 text-2xl font-bold text-primary">Can your business afford not to use it?</p>
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" className="bg-background py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl">How InsurePal Works</h2>
                        <p className="text-xl text-muted-foreground">Four simple steps to transform your insurance operations</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        {steps.map((step, idx) => (
                            <div key={idx} className="group relative">
                                <div className="text-center">
                                    <div className="transition-smooth mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground group-hover:scale-110">
                                        {step.number}
                                    </div>
                                    <h3 className="mb-4 text-xl font-semibold text-foreground">{step.title}</h3>
                                    <p className="leading-relaxed text-muted-foreground">{step.description}</p>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="absolute top-8 left-full hidden h-0.5 w-full -translate-x-1/2 transform bg-border md:block"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            {/* <section className="bg-gradient-subtle py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl">Trusted by Insurance Professionals</h2>
                        <p className="text-xl text-muted-foreground">See what our customers say about InsurePal</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {testimonials.map((testimonial, idx) => (
                            <Card key={idx} className="relative transition-shadow hover:shadow-lg">
                                <CardContent className="p-6">
                                    <div className="mb-4 flex">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="h-5 w-5 fill-current text-yellow-500" />
                                        ))}
                                    </div>
                                    <p className="mb-6 leading-relaxed text-muted-foreground">"{testimonial.quote}"</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{testimonial.name}</div>
                                            <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section> */}

            {/* ── Pricing ── */}
            <section id="pricing" className="bg-background py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold text-foreground lg:text-5xl">Simple, Transparent Pricing</h2>
                        <p className="text-xl text-muted-foreground">Choose the perfect plan for your insurance business</p>
                    </div>

                    <PricingPlans plans={plans} />

                    {/* Setup Fee Callout — informational only; payment happens post-subscription */}
                    <div className="mt-16">
                        <h3 className="mb-2 text-center text-xl font-bold text-foreground">Optional Guided Setup</h3>
                        <p className="mb-6 text-center text-sm text-muted-foreground">
                            After subscribing, choose between <strong>Self-Onboarding</strong> (free) or
                            <strong> Guided Onboarding</strong> — hands-on setup assistance from our team.
                        </p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Self-Onboarding card */}
                            <Card className="border-2">
                                <CardContent className="flex gap-4 p-6">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                        <Rocket className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Self-Onboarding</p>
                                        <p className="text-xl font-bold text-green-600">Free</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Tutorials, documentation, and standard support — no extra cost.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Guided Onboarding card */}
                            <Card className="border-2 border-primary/30 bg-primary/5">
                                <CardContent className="flex gap-4 p-6">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Headphones className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">Guided Onboarding</p>
                                        <p className="text-xl font-bold text-primary">From {fmtNGN(Number(plans[0]?.setup_fee ?? 0))}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Hands-on setup, data import, live session with our team — one-time fee.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="mb-3 text-sm text-muted-foreground">
                                👉 <strong>Subscribe to a plan first</strong>. You'll choose your onboarding type immediately after payment.
                            </p>
                            {/* <Link href={route('register')}>
                                <Button size="sm" variant="outline">
                                    Get Started — Choose a Plan
                                </Button>
                            </Link> */}
                            <a href="#pricing">
                                <Button size="sm" variant="outline">
                                    Get Started — Choose a Plan
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Trust Signals */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-muted-foreground">🔒 Secure payment powered by Paystack • Cancel anytime • No hidden fees</p>
                    </div>
                </div>
            </section>

            {/* ── FAQs ── */}
            <section id="faqs" className="bg-gradient-subtle scroll-mt-24 py-10">
                <FAQSection />
            </section>

            {/* ── High-Authority Positioning ── */}
            <section className="bg-background py-10">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <Badge variant="outline" className="mb-6 border-primary text-primary">
                        <Shield className="mr-1 h-3 w-3" />
                        Premium by Design
                    </Badge>
                    <h2 className="mb-6 text-3xl font-bold text-foreground lg:text-5xl">
                        🏆 Built for Insurance Firms That Take Structure Seriously
                    </h2>
                    <p className="mb-8 text-xl text-muted-foreground">
                        InsurePal is not designed to be the cheapest insurance software. It is built for firms that understand:
                    </p>

                    <div className="mb-10 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
                        {[
                            { icon: TrendingUp, text: 'Growth requires systems.' },
                            { icon: Shield, text: 'Revenue requires structure.' },
                            { icon: CheckCircle, text: 'Professionalism requires organization.' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                                <item.icon className="h-5 w-5 flex-shrink-0 text-primary" />
                                <span className="font-semibold text-foreground">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mb-10 rounded-xl border border-primary/20 bg-primary/5 p-6 text-left">
                        <p className="mb-4 font-semibold text-foreground">InsurePal is for brokers and underwriters who:</p>
                        {[
                            'Want scalable operations',
                            'Value structured workflow',
                            'Understand software as a business investment',
                            'Plan long-term growth',
                        ].map((item, idx) => (
                            <div key={idx} className="mb-2 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <span className="text-sm text-foreground">{item}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-lg font-bold text-primary italic">
                        "InsurePal isn't competing on price. It competes on structure, clarity, and operational control.
                        <br />
                        If your goal is to build a modern, scalable insurance firm — InsurePal was built for you."
                    </p>
                </div>
            </section>

            {/* ── CTA / Demo Request ── */}
            <section className="bg-primary py-16 text-primary-foreground">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="mb-6 text-3xl font-bold lg:text-5xl">Ready to Transform Your Insurance Operations?</h2>
                    <p className="mb-8 text-xl opacity-90">
                        Join insurance professionals already using InsurePal to streamline their business. Request a demo and we'll reach out.
                    </p>

                    <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input
                            placeholder="Your Name"
                            value={demoForm.name}
                            onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                            className="bg-primary-foreground text-foreground"
                        />
                        <Input
                            placeholder="Work Email"
                            type="email"
                            value={demoForm.email}
                            onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                            className="bg-primary-foreground text-foreground"
                        />
                        <Input
                            placeholder="Company Name"
                            value={demoForm.company}
                            onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                            className="bg-primary-foreground text-foreground"
                        />
                        <Input
                            placeholder="Phone Number (optional)"
                            value={demoForm.phone}
                            onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                            className="bg-primary-foreground text-foreground"
                        />
                    </div>

                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Button size="lg" variant="secondary" className="group" onClick={handleDemoSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Sending Request...' : 'Book a Demo'}
                            {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                        </Button>
                        <Link href={route('register')}>
                            <Button size="lg" variant="outline" className="text-black dark:border-white dark:text-white">
                                Get Started Now
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-6 text-sm opacity-75">
                        Questions? Email us at{' '}
                        <a href="mailto:support@insurepal.app" className="underline">
                            support@insurepal.app
                        </a>
                    </p>
                </div>
            </section>
        </FrontendLayout>
    );
};

export default LandingPage;
