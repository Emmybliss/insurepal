import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

export default function Create() {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [half, setHalf] = useState('H1');
    const [commissionDate, setCommissionDate] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const currentYear = new Date().getFullYear();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(route('reports.naicom.store'), {
            reporting_year: parseInt(year, 10),
            reporting_half: half,
            commission_recognition_date: commissionDate || null,
        }, {
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Reports', href: route('reports.index') },
            { title: 'NAICOM Returns', href: route('reports.naicom.index') },
            { title: 'New Report', href: '#' },
        ]}>
            <Head title="New NAICOM Report" />

            <div className="flex flex-col gap-6 p-6 max-w-2xl">
                <div>
                    <h1 className="text-2xl font-bold">New NAICOM Report</h1>
                    <p className="text-sm text-muted-foreground">
                        Generate Forms 7.2A, 7.2B, and 7.2C for regulatory submission.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5" />
                                Report Configuration
                            </CardTitle>
                            <CardDescription>
                                Select the reporting period and optional commission recognition date.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Reporting Half</Label>
                                <RadioGroup value={half} onValueChange={setHalf} className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="H1" id="h1" />
                                        <Label htmlFor="h1">First Half (Jan–Jun)</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="H2" id="h2" />
                                        <Label htmlFor="h2">Second Half (Jul–Dec)</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="year">Reporting Year</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    min={2020}
                                    max={currentYear}
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                />
                                {errors.reporting_year && (
                                    <p className="text-sm text-destructive">{errors.reporting_year}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="commission_date">
                                    Commission Recognition Date
                                    <span className="text-muted-foreground text-xs ml-2">(optional)</span>
                                </Label>
                                <Input
                                    id="commission_date"
                                    type="date"
                                    value={commissionDate}
                                    onChange={(e) => setCommissionDate(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    If not set, defaults to end of the reporting half. Used for straight-line earned commission calculation.
                                </p>
                                {errors.commission_recognition_date && (
                                    <p className="text-sm text-destructive">{errors.commission_recognition_date}</p>
                                )}
                            </div>

                            <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                                <p className="font-medium mb-1">What this generates</p>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    <li>Form 7.2B — Statement of Business Generated</li>
                                    <li>Form 7.2C — Remittance & Outstanding Liability</li>
                                    <li className="text-muted-foreground/60">Form 7.2A — Monthly Assets & Liabilities (coming soon)</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4 mt-6">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('reports.naicom.index'))}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Generating...' : 'Generate Report'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
