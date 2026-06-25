import { useEffect, useState } from 'react';

interface ProductSelectorProps {
    publicKey: string;
    baseUrl: string;
    onSelect: (product: any) => void;
}

export function ProductSelector({ publicKey, baseUrl, onSelect }: ProductSelectorProps) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${baseUrl}/api/v1/widget/products`, {
            headers: {
                'X-Tenant-Key': publicKey,
                Accept: 'application/json',
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load products');
                return res.json();
            })
            .then((data) => {
                setProducts(Array.isArray(data) ? data : data.data || []);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [publicKey, baseUrl]);

    if (loading) return <div className="py-8 text-center">Loading products...</div>;
    if (error) return <div className="py-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div className="space-y-4">
            <h2 className="mb-4 text-xl font-bold">Select Insurance Product</h2>
            {products.length === 0 ? (
                <p className="text-center text-gray-500">No products available.</p>
            ) : (
                <div className="grid gap-3">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="cursor-pointer rounded-lg border p-4 transition-colors hover:border-blue-500 hover:bg-blue-50"
                            onClick={() => onSelect(product)}
                        >
                            <h3 className="text-lg font-bold">{product.name}</h3>
                            <p className="text-sm text-gray-600">{product.description}</p>
                            <div className="mt-2 font-semibold text-blue-600">From ₦{product.base_premium?.toLocaleString() ?? '0'}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
