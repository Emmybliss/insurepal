import { useEffect, useState } from 'react';

interface PaymentHandlerProps {
    publicKey: string;
    baseUrl: string;
    quote: any;
    customer: any;
    productId: number;
    onSuccess: (result: any) => void;
    onBack: () => void;
}

export function PaymentHandler({ publicKey, baseUrl, quote, customer, productId, onSuccess, onBack }: PaymentHandlerProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load Paystack script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePay = async () => {
        setLoading(true);
        setError(null);

        try {
            // Initiate payment on backend
            const res = await fetch(`${baseUrl}/api/v1/widget/payments/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Key': publicKey,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    policy_product_id: productId,
                    email: customer.email,
                    amount: quote.total_amount, // Backend usually recalculates this for security, but we pass it
                    metadata: {
                        customer_data: customer,
                    },
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Payment initialization failed');
            }

            const data = await res.json();
            const { access_code, reference, paystack_public_key } = data.data;

            // MOCK MODE DETECTION
            if (paystack_public_key && paystack_public_key.startsWith('pk_test_mock')) {
                console.log('Mock Payment Mode Detected. Bypassing Paystack Popup.');

                // Simulate processing delay
                setTimeout(() => {
                    const mockResponse = {
                        reference: reference, // Use actual ref from backend
                        status: 'success',
                        message: 'Approved',
                        trans: '1234567890',
                    };
                    onSuccess(mockResponse);
                }, 1500);
                return;
            }

            if (!(window as any).PaystackPop) {
                throw new Error('Paystack script not loaded yet. Please try again.');
            }

            const handler = (window as any).PaystackPop.setup({
                key: paystack_public_key,
                email: customer.email,
                amount: quote.total_amount * 100, // kobo
                currency: quote.currency || 'NGN',
                ref: reference,
                callback: function (response: any) {
                    // Start async policy issuance
                    (async () => {
                        try {
                            const verifyRes = await fetch(`${baseUrl}/api/v1/widget/policies/issue`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Tenant-Key': publicKey,
                                    Accept: 'application/json',
                                },
                                body: JSON.stringify({
                                    payment_reference: response.reference,
                                    policy_product_id: productId,
                                    customer: customer,
                                    ...quote,
                                }),
                            });

                            if (!verifyRes.ok) {
                                throw new Error('Policy issuance failed. Please contact support.');
                            }

                            const result = await verifyRes.json();
                            onSuccess(result);
                        } catch (e: any) {
                            console.error(e);
                            setError('Payment successful but policy issuance failed. Please contact support with reference: ' + response.reference);
                        }
                    })();
                },
                onClose: function () {
                    setLoading(false);
                    // alert('Window closed.');
                },
            });

            handler.openIframe();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
                <button onClick={onBack} className="text-sm text-gray-500 hover:underline">
                    ← Back
                </button>
                <h2 className="text-xl font-bold">Payment</h2>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-2 flex justify-between">
                    <span className="text-gray-600">Premium</span>
                    <span className="font-semibold">₦{quote.base_premium.toLocaleString()}</span>
                </div>
                {quote.tax > 0 && (
                    <div className="mb-2 flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-semibold">₦{quote.tax.toLocaleString()}</span>
                    </div>
                )}
                <div className="mt-2 flex justify-between border-t pt-2">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-blue-700">₦{quote.total_amount.toLocaleString()}</span>
                </div>
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <button
                onClick={handlePay}
                disabled={loading}
                className="w-full rounded bg-green-600 p-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? 'Processing...' : `Pay ₦${quote.total_amount.toLocaleString()}`}
            </button>
        </div>
    );
}
