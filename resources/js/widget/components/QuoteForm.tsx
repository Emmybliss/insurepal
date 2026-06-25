import React, { useState } from 'react';

interface QuoteFormProps {
    publicKey: string;
    baseUrl: string;
    product: any;
    onQuote: (quote: any, customer: any) => void;
    onBack: () => void;
}

export function QuoteForm({ publicKey, baseUrl, product, onQuote, onBack }: QuoteFormProps) {
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        sum_assured: product.min_sum_assured || 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${baseUrl}/api/v1/widget/policies/quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Key': publicKey,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    policy_product_id: product.id,
                    ...formData,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to generate quote');
            }

            const quote = await res.json();
            // Pass quote AND customer data forward
            onQuote(quote, formData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2">
                <button onClick={onBack} className="text-sm text-gray-500 hover:underline">
                    ← Back
                </button>
                <h2 className="text-xl font-bold">Get a Quote</h2>
            </div>

            <div className="mb-4 rounded bg-gray-50 p-3">
                <h3 className="font-semibold">{product.name}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium">First Name</label>
                        <input name="first_name" required className="w-full rounded border p-2" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Last Name</label>
                        <input name="last_name" required className="w-full rounded border p-2" onChange={handleChange} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input name="email" type="email" required className="w-full rounded border p-2" onChange={handleChange} />
                </div>

                <div>
                    <label className="block text-sm font-medium">Phone</label>
                    <input name="phone" type="tel" required className="w-full rounded border p-2" onChange={handleChange} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium">Start Date</label>
                        <input
                            name="start_date"
                            type="date"
                            required
                            className="w-full rounded border p-2"
                            value={formData.start_date}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">End Date</label>
                        <input
                            name="end_date"
                            type="date"
                            required
                            className="w-full rounded border p-2"
                            value={formData.end_date}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium">Sum Assured (Min: {product.min_sum_assured})</label>
                    <input
                        name="sum_assured"
                        type="number"
                        min={product.min_sum_assured}
                        className="w-full rounded border p-2"
                        value={formData.sum_assured}
                        onChange={handleChange}
                        placeholder="Enter value"
                    />
                </div>

                {error && <div className="text-sm text-red-500">{error}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Calculating...' : 'Calculate Premium'}
                </button>
            </form>
        </div>
    );
}
