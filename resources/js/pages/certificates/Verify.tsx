import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, FileText, Search, Shield, X } from 'lucide-react';
import { useState } from 'react';

interface Customer {
    name: string;
    type: string;
}

interface Policy {
    policy_number: string;
    effective_date: string;
    expiry_date: string;
    status: string;
    product_name: string;
}

interface Company {
    name: string;
    address?: string;
}

interface CertificateData {
    certificate_number: string;
    type: string;
    status: string;
    issued_at?: string;
    expires_at?: string;
    policy: Policy;
    customer: Customer;
    company: Company;
}

interface Props {
    certificate?: CertificateData;
    error?: string;
}

export default function CertificateVerify({ certificate, error }: Props) {
    const [searchNumber, setSearchNumber] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchNumber.trim()) {
            router.get(route('certificates.verify', searchNumber.trim()));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'issued':
                return 'bg-green-100 text-green-800';
            case 'generated':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const isPolicyActive = (policy: Policy) => {
        const today = new Date();
        const expiryDate = new Date(policy.expiry_date);
        return policy.status === 'active' && expiryDate > today;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Verify Certificate" />

            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Certificate Verification</h1>
                                <p className="text-sm text-gray-500">Verify the authenticity of insurance certificates</p>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => router.get('/')}>
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Search Form */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Certificate Lookup
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <Label htmlFor="certificate_number">Certificate Number</Label>
                                <Input
                                    id="certificate_number"
                                    value={searchNumber}
                                    onChange={(e) => setSearchNumber(e.target.value)}
                                    placeholder="Enter certificate number (e.g., CERT-2025-00000001)"
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button type="submit" disabled={!searchNumber.trim()}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Verify
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <X className="h-5 w-5 text-red-500" />
                                <div>
                                    <h3 className="font-medium text-red-900">Certificate Not Found</h3>
                                    <p className="mt-1 text-red-700">{error}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-red-600">
                                <p>
                                    Please check the certificate number and try again. If you believe this is an error, please contact the insurance
                                    company directly.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {certificate && (
                    <div className="space-y-6">
                        {/* Verification Status */}
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-500" />
                                    <div>
                                        <h3 className="font-medium text-green-900">Certificate Verified</h3>
                                        <p className="mt-1 text-green-700">
                                            This certificate is authentic and has been verified against our records.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Certificate Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Certificate Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Certificate Number</Label>
                                        <p className="font-mono text-lg font-medium">{certificate.certificate_number}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Type</Label>
                                        <p className="text-sm">
                                            {certificate.type
                                                .split('_')
                                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(' ')}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                                        <Badge className={getStatusColor(certificate.status)}>
                                            {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                                        </Badge>
                                    </div>
                                    {certificate.issued_at && (
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Issued Date</Label>
                                            <p className="text-sm">{formatDate(certificate.issued_at)}</p>
                                        </div>
                                    )}
                                    {certificate.expires_at && (
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Expires</Label>
                                            <p className="text-sm">{formatDate(certificate.expires_at)}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Policy Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Policy Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Policy Number</Label>
                                        <p className="font-medium">{certificate.policy.policy_number}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Product</Label>
                                        <p className="text-sm">{certificate.policy.product_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Policy Status</Label>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={
                                                    isPolicyActive(certificate.policy) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }
                                            >
                                                {isPolicyActive(certificate.policy) ? 'Active' : 'Inactive/Expired'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Effective Period</Label>
                                        <p className="text-sm">
                                            {formatDate(certificate.policy.effective_date)} - {formatDate(certificate.policy.expiry_date)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Insured Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Insured Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Name</Label>
                                        <p className="font-medium">{certificate.customer.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Customer Type</Label>
                                        <p className="text-sm capitalize">{certificate.customer.type}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Insurance Company */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Insurance Company</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Company Name</Label>
                                        <p className="font-medium">{certificate.company.name}</p>
                                    </div>
                                    {certificate.company.address && (
                                        <div>
                                            <Label className="text-sm font-medium text-gray-600">Address</Label>
                                            <p className="text-sm">{certificate.company.address}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Disclaimer */}
                        <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="p-6">
                                <h3 className="mb-2 font-medium text-amber-900">Important Notice</h3>
                                <div className="space-y-2 text-sm text-amber-800">
                                    <p>
                                        This verification confirms that the certificate was issued by the insurance company and contains the
                                        information shown above.
                                    </p>
                                    <p>
                                        For detailed policy terms, conditions, and coverage limits, please refer to the original policy document or
                                        contact the insurance company directly.
                                    </p>
                                    <p>
                                        This verification is generated in real-time and reflects the current status of the certificate in the system.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Help Section */}
                {!certificate && !error && (
                    <Card>
                        <CardHeader>
                            <CardTitle>How to Verify a Certificate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-sm text-gray-600">
                                <div className="flex gap-3">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                                        1
                                    </div>
                                    <p>
                                        Locate the certificate number on your insurance certificate document. It's usually displayed prominently at
                                        the top of the document.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                                        2
                                    </div>
                                    <p>
                                        Enter the complete certificate number in the search box above. Make sure to include all letters, numbers, and
                                        hyphens exactly as shown.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                                        3
                                    </div>
                                    <p>
                                        Click "Verify" to check the certificate against our records. You'll see the verification results immediately.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Footer */}
            <div className="mt-12 border-t bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="text-center text-sm text-gray-500">
                        <p>Certificate verification system powered by InsurePal</p>
                        <p className="mt-1">For support, please contact your insurance provider directly.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
