import { useEffect, useState } from 'react';
import { PaymentHandler } from './components/PaymentHandler';
import { ProductSelector } from './components/ProductSelector';
import { QuoteForm } from './components/QuoteForm';
import { SuccessScreen } from './components/SuccessScreen';

// Base URL for API calls - derived from script source or hardcoded/env
const API_BASE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:8000'; // Should be dynamic

interface WidgetAppProps {
    publicKey: string;
    product?: string; // Pre-selected product ID
}

export default function WidgetApp({ publicKey, product }: WidgetAppProps) {
    const [step, setStep] = useState<'products' | 'quote' | 'payment' | 'success'>('products');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [quoteData, setQuoteData] = useState<any>(null);
    const [customerData, setCustomerData] = useState<any>(null);
    const [paymentResult, setPaymentResult] = useState<any>(null);

    useEffect(() => {
        if (product) {
            // Fetch product details and skip to quote
            // For now, start at products list
        }
    }, [product]);

    const handleProductSelect = (prod: any) => {
        setSelectedProduct(prod);
        setStep('quote');
    };

    const handleQuoteGenerated = (quote: any, customer: any) => {
        setQuoteData(quote);
        setCustomerData(customer);
        setStep('payment');
    };

    const handlePaymentSuccess = (result: any) => {
        setPaymentResult(result);
        setStep('success');
    };

    return (
        <div className="insurepal-widget fixed right-4 bottom-4 z-50 font-sans">
            {/* Trigger Button */}
            <button
                className="flex items-center gap-2 rounded-full bg-blue-600 p-4 font-bold text-white shadow-lg transition-all hover:bg-blue-700"
                onClick={() => document.getElementById('insurepal-modal')?.classList.remove('hidden')}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Get Insurance
            </button>

            {/* Modal Container */}
            <div id="insurepal-modal" className="fixed inset-0 z-[60] flex hidden items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-xl bg-white shadow-2xl">
                    <button
                        className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-700"
                        onClick={() => document.getElementById('insurepal-modal')?.classList.add('hidden')}
                    >
                        ✕
                    </button>

                    <div className="p-6">
                        {step === 'products' && <ProductSelector publicKey={publicKey} baseUrl={API_BASE_URL} onSelect={handleProductSelect} />}

                        {step === 'quote' && selectedProduct && (
                            <QuoteForm
                                publicKey={publicKey}
                                baseUrl={API_BASE_URL}
                                product={selectedProduct}
                                onQuote={handleQuoteGenerated}
                                onBack={() => setStep('products')}
                            />
                        )}

                        {step === 'payment' && quoteData && (
                            <PaymentHandler
                                publicKey={publicKey}
                                baseUrl={API_BASE_URL}
                                quote={quoteData}
                                customer={customerData}
                                productId={selectedProduct.id}
                                onSuccess={handlePaymentSuccess}
                                onBack={() => setStep('quote')}
                            />
                        )}

                        {step === 'success' && (
                            <SuccessScreen
                                result={paymentResult}
                                onClose={() => {
                                    setStep('products');
                                    document.getElementById('insurepal-modal')?.classList.add('hidden');
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
