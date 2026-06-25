import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, Copy, Key, Shield, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'API Settings',
        href: '/settings/api',
    },
];

interface ApiKey {
    id: number;
    name: string;
    public_key: string;
    last_4_chars: string;
    created_at: string;
    last_used_at: string | null;
    scopes: string[];
}

interface ApiSettingsProps {
    api_keys: ApiKey[];
    paystack_config: {
        paystack_public_key: string | null;
        paystack_secret_key: string | null;
        paystack_webhook_secret: string | null;
    };
}

export default function ApiSettings({ api_keys, paystack_config }: ApiSettingsProps) {
    const { flash } = usePage().props as any;
    const [copied, setCopied] = useState<string | null>(null);
    const [, setShowNewKeyDialog] = useState(false);

    // Form for new key
    const {
        data: newData,
        setData: setNewData,
        post: createKey,
        processing: creating,
        reset: resetNewKey,
    } = useForm({
        name: '',
        allowed_domains: '',
        scopes: ['*'], // Default to all for now
    });

    // Form for Paystack
    const {
        data: paystackData,
        setData: setPaystackData,
        patch: updatePaystack,
        processing: savingPaystack,
    } = useForm({
        paystack_public_key: paystack_config.paystack_public_key ?? '',
        paystack_secret_key: '',
        paystack_webhook_secret: '',
    });

    const handleCreateKey: FormEventHandler = (e) => {
        e.preventDefault();
        createKey(route('settings.api.generate'), {
            onSuccess: () => {
                resetNewKey();
                // The flash message will trigger the display of the secret key
                setShowNewKeyDialog(true);
            },
        });
    };

    const handleRevoke = (id: number) => {
        if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
            router.delete(route('settings.api.destroy', id));
        }
    };

    const submitPaystack: FormEventHandler = (e) => {
        e.preventDefault();
        updatePaystack(route('settings.api.paystack'));
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="API Configuration" description="Manage your API keys and integration settings" />

                    {/* New Key Success Dialog */}
                    <Dialog open={!!flash?.new_key_value} onOpenChange={() => {}}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-green-600">API Key Generated</DialogTitle>
                                <DialogDescription>Please copy your new secret API key now. You won't be able to see it again!</DialogDescription>
                            </DialogHeader>
                            <div className="group relative rounded-md bg-muted p-4 font-mono text-sm break-all">
                                {flash?.new_key_value}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(flash?.new_key_value, 'new_key')}
                                >
                                    {copied === 'new_key' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => window.location.reload()}>I have stored it</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* API Keys Management */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    API Keys
                                </CardTitle>
                                <CardDescription>Manage API keys for server-side access and public keys for widgets.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Create New Key Form */}
                            <div className="rounded-md border bg-muted/30 p-4">
                                <h3 className="mb-4 flex items-center gap-2 font-medium">
                                    <Shield className="h-4 w-4" /> Generate New Key
                                </h3>
                                <form onSubmit={handleCreateKey} className="grid items-end gap-4 md:grid-cols-3">
                                    <div>
                                        <Label htmlFor="key_name">Key Name</Label>
                                        <Input
                                            id="key_name"
                                            placeholder="e.g. Website Widget"
                                            value={newData.name}
                                            onChange={(e) => setNewData('name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="allowed_domains">
                                            Allowed Domains <span className="text-xs text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="allowed_domains"
                                            placeholder="example.com, app.example.com"
                                            value={newData.allowed_domains}
                                            onChange={(e) => setNewData('allowed_domains', e.target.value)}
                                        />
                                        <p className="mt-1 text-[10px] text-muted-foreground">
                                            Comma separated. Leave empty to allow all (not recommended).
                                        </p>
                                    </div>
                                    <Button type="submit" disabled={creating}>
                                        Create API Key
                                    </Button>
                                </form>
                            </div>

                            {/* Keys List */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Public Key (Widget ID)</TableHead>
                                            <TableHead>Secret Hint</TableHead>
                                            <TableHead>Last Used</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {api_keys.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                                    No API keys found. Generate one to get started.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            api_keys.map((key) => (
                                                <TableRow key={key.id}>
                                                    <TableCell className="font-medium">
                                                        {key.name}
                                                        <div className="text-xs text-muted-foreground">
                                                            Created: {new Date(key.created_at).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">
                                                        {key.public_key}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="ml-2 h-4 w-4"
                                                            onClick={() => copyToClipboard(key.public_key, 'pk_' + key.id)}
                                                        >
                                                            {copied === 'pk_' + key.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs">...{key.last_4_chars}</TableCell>
                                                    <TableCell className="text-xs">
                                                        {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="destructive" size="sm" onClick={() => handleRevoke(key.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Paystack Config */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Paystack Configuration</CardTitle>
                            <CardDescription>Provide your Paystack API keys to process payments. These are encrypted.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitPaystack} className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="paystack_public_key">Paystack Public Key</Label>
                                    <Input
                                        id="paystack_public_key"
                                        value={paystackData.paystack_public_key}
                                        onChange={(e) => setPaystackData('paystack_public_key', e.target.value)}
                                        placeholder="pk_live_..."
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="paystack_secret_key">Paystack Secret Key</Label>
                                    <Input
                                        id="paystack_secret_key"
                                        type="password"
                                        value={paystackData.paystack_secret_key}
                                        onChange={(e) => setPaystackData('paystack_secret_key', e.target.value)}
                                        placeholder={paystack_config.paystack_secret_key ? 'Stored (Leave empty to keep)' : 'sk_live_...'}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="paystack_webhook_secret">Webhook Secret (Required)</Label>
                                    <Input
                                        id="paystack_webhook_secret"
                                        type="password"
                                        value={paystackData.paystack_webhook_secret}
                                        onChange={(e) => setPaystackData('paystack_webhook_secret', e.target.value)}
                                        placeholder={paystack_config.paystack_webhook_secret ? 'Stored (Leave empty)' : 'Required for verification'}
                                    />
                                </div>

                                <Button type="submit" disabled={savingPaystack}>
                                    Save Paystack Settings
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Widget Integration Guide</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
                                <p className="mb-2">Copy this code to your website where you want the widget to appear:</p>
                                <pre className="rounded bg-black p-3 font-mono text-white">
                                    {`<script src="${window.location.origin}/js/widget/v1.js"
        data-key="pk_YOUR_WIDGET_KEY_HERE">
</script>`}
                                </pre>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Replace <code>pk_YOUR_WIDGET_KEY_HERE</code> with a Public Key from above.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
