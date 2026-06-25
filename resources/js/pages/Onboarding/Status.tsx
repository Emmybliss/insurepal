import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Circle, Clock } from 'lucide-react';

interface Tenant {
    id: number;
    name: string;
    company_name?: string;
    type?: string;
    onboarding_completed: boolean;
    onboarding_completed_at?: string;
}

interface OnboardingStep {
    subscription_selected?: boolean;
    payment_completed?: boolean;
    company_details?: boolean;
}

interface Props {
    tenant: Tenant;
    onboardingSteps: OnboardingStep;
}

export default function Status({ tenant, onboardingSteps }: Props) {
    const steps = [
        {
            id: 1,
            name: 'Select Subscription Plan',
            description: 'Choose the plan that fits your business needs',
            completed: onboardingSteps?.subscription_selected || false,
            route: 'onboarding.select-plan',
        },
        {
            id: 2,
            name: 'Complete Payment',
            description: 'Secure payment through Paystack',
            completed: onboardingSteps?.payment_completed || false,
            route: 'onboarding.select-plan',
        },
        {
            id: 3,
            name: 'Company Details',
            description: 'Provide your company information',
            completed: onboardingSteps?.company_details || false,
            route: 'onboarding.company-details',
        },
    ];

    const completedSteps = steps.filter((step) => step.completed).length;
    const totalSteps = steps.length;
    const progress = (completedSteps / totalSteps) * 100;

    const getNextStep = () => {
        return steps.find((step) => !step.completed);
    };

    const nextStep = getNextStep();

    const getStepIcon = (completed: boolean, stepNumber: number) => {
        if (completed) {
            return <CheckCircle className="h-8 w-8 text-green-600" />;
        }

        if (nextStep && nextStep.id === stepNumber) {
            return <Clock className="h-8 w-8 text-blue-600" />;
        }

        return <Circle className="h-8 w-8 text-gray-300" />;
    };

    return (
        <>
            <Head title="Onboarding Status" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Welcome{tenant.name ? `, ${tenant.name}` : ''}!</h1>
                        <p className="mt-4 text-lg text-gray-600">
                            {tenant.onboarding_completed ? 'Your account is fully set up and ready to go!' : "Let's get your account set up"}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <Card className="mb-8">
                        <CardContent className="pt-6">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700">Overall Progress</span>
                                <span className="font-semibold text-blue-600">
                                    {completedSteps} of {totalSteps} completed
                                </span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Steps */}
                    <div className="space-y-4">
                        {steps.map((step, index) => {
                            const isNext = nextStep && nextStep.id === step.id;

                            return (
                                <Card
                                    key={step.id}
                                    className={`${
                                        isNext
                                            ? 'border-2 border-blue-600 shadow-lg'
                                            : step.completed
                                              ? 'border border-green-200 bg-green-50'
                                              : 'border border-gray-200'
                                    }`}
                                >
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            {getStepIcon(step.completed, step.id)}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg">{step.name}</CardTitle>
                                                    {step.completed && (
                                                        <Badge variant="outline" className="border-green-600 text-green-700">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            Completed
                                                        </Badge>
                                                    )}
                                                    {isNext && (
                                                        <Badge variant="outline" className="border-blue-600 text-blue-700">
                                                            <AlertCircle className="mr-1 h-3 w-3" />
                                                            Action Required
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardDescription className="mt-1">{step.description}</CardDescription>
                                            </div>
                                            {isNext && (
                                                <Link href={route(step.route)}>
                                                    <Button>Continue</Button>
                                                </Link>
                                            )}
                                        </div>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Completion Message or Next Step */}
                    <div className="mt-8">
                        {tenant.onboarding_completed ? (
                            <Card className="border-2 border-green-600 bg-green-50">
                                <CardContent className="py-8 text-center">
                                    <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
                                    <h2 className="mb-2 text-2xl font-bold text-gray-900">Congratulations! You're All Set 🎉</h2>
                                    <p className="mb-6 text-gray-700">
                                        Your account has been successfully set up. You can now access all features of the platform.
                                    </p>
                                    <Link href={route('dashboard')}>
                                        <Button size="lg" className="bg-green-600 hover:bg-green-700">
                                            Go to Dashboard
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            nextStep && (
                                <Card className="border-2 border-blue-600">
                                    <CardContent className="py-8 text-center">
                                        <Clock className="mx-auto mb-4 h-16 w-16 text-blue-600" />
                                        <h2 className="mb-2 text-2xl font-bold text-gray-900">Next Step: {nextStep.name}</h2>
                                        <p className="mb-6 text-gray-700">{nextStep.description}</p>
                                        <Link href={route(nextStep.route)}>
                                            <Button size="lg">Continue Setup</Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            )
                        )}
                    </div>

                    {/* Help Section */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Need assistance?{' '}
                            <a href="mailto:support@insurepal.com" className="font-medium text-blue-600 hover:underline">
                                Contact Support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
