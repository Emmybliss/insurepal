import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Check, Plus, Search, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface PolicyClass {
    id: number;
    name: string;
    code: string;
}

interface Clause {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_system: boolean;
    is_active: boolean;
    policy_class_id: number | null;
    sort_order: number;
    policy_class: { id: number; name: string } | null;
}

interface IndexProps {
    clauses: {
        data: Clause[];
        total: number;
        from: number;
        to: number;
        links: any[];
    };
    policyClasses: PolicyClass[];
}

const clauseTypes = [
    { value: 'coverage', label: 'Coverage' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'exclusion', label: 'Exclusion' },
    { value: 'subjectivity', label: 'Subjectivity' },
    { value: 'condition', label: 'Condition' },
    { value: 'special', label: 'Special' },
];

const typeStyles: Record<string, string> = {
    coverage: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    warranty: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    exclusion: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    subjectivity: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    condition: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    special: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export default function Index({ clauses, policyClasses }: IndexProps) {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const addForm = useForm({
        clause_type: 'coverage',
        title: '',
        content: '',
        policy_class_id: '',
        sort_order: 0,
    });

    const handleFilter = () => {
        router.get(
            route('clause-library.index'),
            {
                search,
                clause_type: typeFilter,
                policy_class_id: classFilter,
            },
            { preserveState: true },
        );
    };

    const handleClear = () => {
        setSearch('');
        setTypeFilter('');
        setClassFilter('');
        router.get(route('clause-library.index'));
    };

    const handleAddSubmit = () => {
        addForm.post(route('clause-library.store'), {
            onSuccess: () => {
                setShowAddForm(false);
                addForm.reset();
                toast.success('Clause created successfully');
            },
        });
    };

    const handleDelete = (id: number, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"?`)) {
            router.delete(route('clause-library.destroy', id), {
                onSuccess: () => toast.success('Clause deleted'),
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Clause Library" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Clause Library</h1>
                        <p className="text-muted-foreground">Manage standard clauses, warranties, exclusions, and conditions</p>
                    </div>
                    <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Clause
                    </Button>
                </div>

                {showAddForm && (
                    <div className="rounded-lg border p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">New Clause</h2>
                            <button
                                onClick={() => { setShowAddForm(false); addForm.reset(); }}
                                className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <Label>Clause Type</Label>
                                <Select
                                    value={addForm.data.clause_type}
                                    onValueChange={(v) => addForm.setData('clause_type', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clauseTypes.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {addForm.errors.clause_type && (
                                    <p className="text-sm text-red-500">{addForm.errors.clause_type}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label>Class Restriction (optional)</Label>
                                <Select
                                    value={addForm.data.policy_class_id}
                                    onValueChange={(v) => addForm.setData('policy_class_id', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Classes</SelectItem>
                                        {policyClasses.map((pc) => (
                                            <SelectItem key={pc.id} value={String(pc.id)}>{pc.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <Label>Title</Label>
                                <Input
                                    value={addForm.data.title}
                                    onChange={(e) => addForm.setData('title', e.target.value)}
                                    placeholder="Clause title"
                                />
                                {addForm.errors.title && (
                                    <p className="text-sm text-red-500">{addForm.errors.title}</p>
                                )}
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <Label>Content</Label>
                                <Textarea
                                    value={addForm.data.content}
                                    onChange={(e) => addForm.setData('content', e.target.value)}
                                    placeholder="Clause text content..."
                                    rows={4}
                                />
                                {addForm.errors.content && (
                                    <p className="text-sm text-red-500">{addForm.errors.content}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label>Sort Order</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={addForm.data.sort_order}
                                    onChange={(e) => addForm.setData('sort_order', Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowAddForm(false); addForm.reset(); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddSubmit} disabled={addForm.processing}>
                                {addForm.processing ? 'Saving...' : 'Save Clause'}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="rounded-lg p-4 shadow">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                            <Label className="mb-1 block text-sm font-medium">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    placeholder="Search by title..."
                                    className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block text-sm font-medium">Type</Label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                            >
                                <option value="">All Types</option>
                                {clauseTypes.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className="mb-1 block text-sm font-medium">Class</Label>
                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800"
                            >
                                <option value="">All Classes</option>
                                {policyClasses.map((pc) => (
                                    <option key={pc.id} value={pc.id}>{pc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={handleFilter}>Apply</Button>
                            <Button variant="outline" onClick={handleClear}>Clear</Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50 text-left">
                                <th className="px-4 py-3 font-medium">Title</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Class</th>
                                <th className="px-4 py-3 font-medium">System</th>
                                <th className="px-4 py-3 font-medium">Active</th>
                                <th className="px-4 py-3 font-medium">Sort</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {clauses.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        No clauses found.
                                    </td>
                                </tr>
                            ) : (
                                clauses.data.map((clause) => (
                                    <ClauseRow
                                        key={clause.id}
                                        clause={clause}
                                        policyClasses={policyClasses}
                                        isEditing={editingId === clause.id}
                                        onStartEdit={() => setEditingId(clause.id)}
                                        onCancelEdit={() => setEditingId(null)}
                                        onDelete={() => handleDelete(clause.id, clause.title)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {clauses.links && clauses.total > 0 && (
                    <div className="flex items-center justify-between rounded-lg px-4 py-3 shadow">
                        <div className="text-sm text-muted-foreground">
                            Showing {clauses.from} to {clauses.to} of {clauses.total} results
                        </div>
                        <div className="flex gap-2">
                            {clauses.links.map((link: any, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => link.url && router.visit(link.url)}
                                    disabled={!link.url}
                                    className={`rounded-md px-3 py-1 text-sm ${
                                        link.active
                                            ? 'bg-primary text-white'
                                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function ClauseRow({
    clause,
    policyClasses,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onDelete,
}: {
    clause: Clause;
    policyClasses: PolicyClass[];
    isEditing: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onDelete: () => void;
}) {
    const form = useForm({
        title: clause.title,
        content: clause.content,
        clause_type: clause.clause_type,
        policy_class_id: clause.policy_class_id ?? ('' as string | number),
        sort_order: clause.sort_order,
        is_active: clause.is_active,
    });

    const handleSave = () => {
        form.put(route('clause-library.update', clause.id), {
            onSuccess: () => {
                onCancelEdit();
                toast.success('Clause updated');
            },
        });
    };

    const handleToggleActive = () => {
        router.put(
            route('clause-library.update', clause.id),
            { is_active: !clause.is_active },
            { onSuccess: () => toast.success('Status updated') },
        );
    };

    const typeLabel = clauseTypes.find((t) => t.value === clause.clause_type)?.label || clause.clause_type;

    if (isEditing) {
        return (
            <tr className="bg-muted/30">
                <td className="px-4 py-2">
                    <Input
                        value={form.data.title}
                        onChange={(e) => form.setData('title', e.target.value)}
                        className="h-8 text-sm"
                    />
                    {form.errors.title && <p className="text-xs text-red-500">{form.errors.title}</p>}
                </td>
                <td className="px-4 py-2">
                    <select
                        value={form.data.clause_type}
                        onChange={(e) => form.setData('clause_type', e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                    >
                        {clauseTypes.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </td>
                <td className="px-4 py-2">
                    <select
                        value={form.data.policy_class_id}
                        onChange={(e) => form.setData('policy_class_id', e.target.value ? Number(e.target.value) : '')}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
                    >
                        <option value="">All</option>
                        {policyClasses.map((pc) => (
                            <option key={pc.id} value={pc.id}>{pc.name}</option>
                        ))}
                    </select>
                </td>
                <td className="px-4 py-2 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {clause.is_system ? 'System' : 'Custom'}
                    </span>
                </td>
                <td className="px-4 py-2 text-center">
                    <button
                        type="button"
                        onClick={handleToggleActive}
                        className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
                            clause.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                clause.is_active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                            }`}
                        />
                    </button>
                </td>
                <td className="px-4 py-2">
                    <Input
                        type="number"
                        min={0}
                        value={form.data.sort_order}
                        onChange={(e) => form.setData('sort_order', Number(e.target.value))}
                        className="h-8 w-20 text-sm"
                    />
                </td>
                <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={handleSave}
                            disabled={form.processing}
                            className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onCancelEdit}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-muted/30">
            <td className="max-w-xs truncate px-4 py-3 font-medium">{clause.title}</td>
            <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeStyles[clause.clause_type] || 'bg-gray-100 text-gray-800'}`}>
                    {typeLabel}
                </span>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
                {clause.policy_class?.name || <span className="text-xs italic">All classes</span>}
            </td>
            <td className="px-4 py-3">
                {clause.is_system ? (
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        System
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        Custom
                    </span>
                )}
            </td>
            <td className="px-4 py-3">
                <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
                        clause.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            clause.is_active ? 'translate-x-[18px]' : 'translate-x-[2px]'
                        }`}
                    />
                </button>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{clause.sort_order}</td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={onStartEdit}
                        className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Edit"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}
