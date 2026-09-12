import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SubdomainInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    ignoreTenantId?: number;
    required?: boolean;
    label?: string;
}

export function SubdomainInput({
    value,
    onChange,
    error,
    ignoreTenantId,
    required = false,
    label = 'Portal Address / Subdomain',
}: SubdomainInputProps) {
    const [checking, setChecking] = useState(false);
    const [availability, setAvailability] = useState<{ available: boolean; message: string } | null>(null);

    // Get root host for preview (e.g. insurepal.app or local host)
    const rootHost = typeof window !== 'undefined' ? window.location.hostname.replace(/^www\./, '').split('.').slice(-2).join('.') : 'insurepal.app';

    useEffect(() => {
        const cleanVal = value.trim().toLowerCase();

        if (!cleanVal || cleanVal.length < 2) {
            setAvailability(null);
            setChecking(false);
            return;
        }

        const timer = setTimeout(async () => {
            setChecking(true);
            try {
                const params = new URLSearchParams({ subdomain: cleanVal });
                if (ignoreTenantId) {
                    params.append('ignore_tenant_id', ignoreTenantId.toString());
                }

                const res = await fetch(`/api/tenants/check-subdomain?${params.toString()}`);
                const data = await res.json();
                setAvailability({
                    available: data.available,
                    message: data.message,
                });
            } catch {
                setAvailability(null);
            } finally {
                setChecking(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [value, ignoreTenantId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '');
        onChange(raw);
    };

    const previewSubdomain = value.trim().toLowerCase() || 'your-portal';
    const previewUrl = `https://${previewSubdomain}.${rootHost}`;

    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label htmlFor="subdomain">
                    {label} {required && <span className="text-destructive">*</span>}
                </Label>
                {checking && (
                    <span className="flex items-center text-xs text-muted-foreground">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Checking availability...
                    </span>
                )}
                {!checking && availability && (
                    <span
                        className={`flex items-center text-xs font-medium ${
                            availability.available ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                        }`}
                    >
                        {availability.available ? (
                            <>
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                {availability.message}
                            </>
                        ) : (
                            <>
                                <XCircle className="mr-1 h-3.5 w-3.5 text-destructive" />
                                {availability.message}
                            </>
                        )}
                    </span>
                )}
            </div>

            <div className="flex rounded-md shadow-xs">
                <Input
                    id="subdomain"
                    type="text"
                    name="subdomain"
                    value={value}
                    onChange={handleChange}
                    placeholder="neta"
                    required={required}
                    className="rounded-r-none focus:z-10"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    .{rootHost}
                </span>
            </div>

            {error && <p className="text-xs font-medium text-destructive">{error}</p>}

            <p className="text-xs text-muted-foreground">
                Your portal will be accessible at:{' '}
                <span className="font-mono font-medium text-foreground underline decoration-primary/40">{previewUrl}</span>
            </p>
        </div>
    );
}
