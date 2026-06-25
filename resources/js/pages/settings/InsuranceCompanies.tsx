import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Building2, Plus, Star, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface SavedCompany {
    id: string;
    source: 'tenant';
    name: string;
    company_name: string;
    branch_name: string | null;
    company_id: string;
    branch_id: string | null;
    email: string | null;
    phone: string | null;
    naicom_reg_number: string | null;
    rc_number: string | null;
    reference_code: string | null;
    is_preferred: boolean;
}

interface RegistryCompany {
    id: string;
    source: 'registry';
    name: string;
    company_name: string;
    company_id: string;
    branch: { id: string; name: string } | null;
    has_branches: boolean;
    email: string | null;
    phone: string | null;
}

interface PageProps {
    companies: SavedCompany[];
}

export default function InsuranceCompaniesSettings({ companies: initialCompanies }: PageProps) {
    const [savedCompanies, setSavedCompanies] = useState<SavedCompany[]>(initialCompanies);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [registryQuery, setRegistryQuery] = useState('');
    const [registryResults, setRegistryResults] = useState<RegistryCompany[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<RegistryCompany | null>(null);
    const [referenceCode, setReferenceCode] = useState('');
    const [isPreferred, setIsPreferred] = useState(false);
    const [saving, setSaving] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>();

    const fetchSaved = async () => {
        try {
            const res = await fetch(route('settings.insurance-companies.index'));
            if (res.ok) {
                const data = await res.json();
                setSavedCompanies(data);
            }
        } catch {
            console.error('Failed to fetch saved companies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSaved();
    }, []);

    const searchRegistry = async (q: string) => {
        if (q.length < 2) {
            setRegistryResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await fetch(`/settings/insurance-companies/registry?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setRegistryResults(data);
            }
        } catch {
            console.error('Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setRegistryQuery(value);
        setSelectedCompany(null);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => searchRegistry(value), 300);
    };

    const handleAdd = async () => {
        if (!selectedCompany) return;
        setSaving(true);
        try {
            await router.post(route('settings.insurance-companies.store'), {
                insurance_company_id: selectedCompany.company_id,
                insurance_company_branch_id: selectedCompany.branch?.id ?? null,
                reference_code: referenceCode,
                is_preferred: isPreferred,
            }, {
                onSuccess: () => {
                    toast.success('Insurance company added successfully');
                    setShowAddModal(false);
                    setRegistryQuery('');
                    setRegistryResults([]);
                    setSelectedCompany(null);
                    setReferenceCode('');
                    setIsPreferred(false);
                    fetchSaved();
                },
                onError: (err) => {
                    toast.error(Object.values(err)[0] as string || 'Failed to add company');
                },
                onFinish: () => setSaving(false),
            });
        } catch {
            setSaving(false);
            toast.error('Failed to add company');
        }
    };

    const handleRemove = (company: SavedCompany) => {
        if (!confirm(`Remove "${company.name}" from your companies?`)) return;
        router.delete(route('settings.insurance-companies.destroy', company.id), {
            onSuccess: () => {
                toast.success('Company removed');
                fetchSaved();
            },
            onError: () => toast.error('Failed to remove company'),
        });
    };

    const handleTogglePreferred = (company: SavedCompany) => {
        router.put(route('settings.insurance-companies.update', company.id), {
            is_preferred: !company.is_preferred,
        } as any, {
            onSuccess: () => {
                toast.success(company.is_preferred ? 'Preferred status removed' : 'Set as preferred');
                fetchSaved();
            },
            onError: () => toast.error('Failed to update'),
        });
    };

    return (
        <AppLayout>
            <Head title="Insurance Companies - Settings" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Insurance Companies</h2>
                        <p className="text-muted-foreground">
                            Manage the insurance companies and branches your organization works with
                        </p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Company
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Companies ({savedCompanies.length})</CardTitle>
                        <CardDescription>
                            These companies and branches will appear in search when creating placements, broker slips, and policies
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center text-muted-foreground">Loading...</div>
                        ) : savedCompanies.length === 0 ? (
                            <div className="py-8 text-center">
                                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">No insurance companies added yet</p>
                                <Button variant="outline" className="mt-4" onClick={() => setShowAddModal(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Company
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="pb-3 text-left font-medium">Company & Branch</th>
                                            <th className="pb-3 text-left font-medium">Contact</th>
                                            <th className="pb-3 text-left font-medium">Reference Code</th>
                                            <th className="pb-3 text-center font-medium">Preferred</th>
                                            <th className="pb-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {savedCompanies.map((company) => (
                                            <tr key={company.id} className="border-b">
                                                <td className="py-3">
                                                    <div className="font-medium">{company.company_name}</div>
                                                    {company.branch_name && <div className="text-sm text-muted-foreground">{company.branch_name}</div>}
                                                </td>
                                                <td className="py-3 text-sm">
                                                    {company.email && <div>{company.email}</div>}
                                                    {company.phone && <div className="text-muted-foreground">{company.phone}</div>}
                                                    {!company.email && !company.phone && <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="py-3 text-sm text-muted-foreground">
                                                    {company.reference_code || '—'}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Switch
                                                        checked={company.is_preferred}
                                                        onCheckedChange={() => handleTogglePreferred(company)}
                                                    />
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600"
                                                        onClick={() => handleRemove(company)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Add Insurance Company</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Search Registry</Label>
                                <Input
                                    placeholder="Type company or branch name..."
                                    value={registryQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                />
                            </div>

                            {searching && (
                                <div className="py-4 text-center text-sm text-muted-foreground">Searching...</div>
                            )}

                            {!searching && registryQuery.length >= 2 && registryResults.length === 0 && (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                    No matching companies or branches found
                                </div>
                            )}

                            {registryResults.length > 0 && !selectedCompany && (
                                <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border">
                                    {registryResults.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                                            onClick={() => setSelectedCompany(item)}
                                        >
                                            <div>
                                                <span className="font-medium">{item.name}</span>
                                                {item.has_branches && (
                                                    <Badge variant="outline" className="ml-2 text-[10px]">
                                                        Branch
                                                    </Badge>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedCompany && (
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium">{selectedCompany.company_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Branch: {selectedCompany.branch?.name || 'Default'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedCompany(null)}
                                        >
                                            Change
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="ref_code">Reference Code (optional)</Label>
                                <Input
                                    id="ref_code"
                                    value={referenceCode}
                                    onChange={(e) => setReferenceCode(e.target.value)}
                                    placeholder="Internal reference code"
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                    <p className="text-sm font-medium">Preferred Company</p>
                                    <p className="text-xs text-muted-foreground">
                                        Preferred companies appear first in search results
                                    </p>
                                </div>
                                <Switch
                                    checked={isPreferred}
                                    onCheckedChange={setIsPreferred}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAdd} disabled={!selectedCompany || saving}>
                                    {saving ? 'Adding...' : 'Add Company'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
