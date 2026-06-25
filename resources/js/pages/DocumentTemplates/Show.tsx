import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, FileText } from 'lucide-react';

interface TemplateConfig {
    key: string;
    label: string;
    type: string;
    view_path: string;
    preview_image?: string | null;
    supported_placeholders?: string[];
    customizable_properties?: Record<string, any>;
    editable_labels?: Record<string, any>;
}

interface ShowProps {
    template: TemplateConfig;
    placeholders: string[];
    sampleData: Record<string, any>;
}

const typeColors: Record<string, string> = {
    certificate: 'bg-blue-100 text-blue-800',
    invoice: 'bg-green-100 text-green-800',
    debit_note: 'bg-orange-100 text-orange-800',
    credit_note: 'bg-purple-100 text-purple-800',
    receipt: 'bg-pink-100 text-pink-800',
};

export default function Show({ template, placeholders, sampleData }: ShowProps) {
    const type = template.type || 'certificate';

    return (
        <AppLayout>
            <Head title={`Preview: ${template.label}`} />

            <div className="flex h-screen flex-col bg-gray-50">
                <div className="border-b border-gray-200 bg-white">
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">

                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{template.label}</h1>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
                                            {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </span>
                                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
                                            {template.key}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='flex gap-4 items-center justify-center'>
                                <Button onClick={() => router.get(route('templates.index'))} variant="outline">
                                    Close
                                </Button>
                                <Link
                                    href={route('templates.edit', template.key)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/50"
                                >
                                    <Edit className="h-4 w-4" />
                                    Customize
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1">
                    <div className="w-80 overflow-auto border-r border-gray-200 bg-white p-6">
                        <div className="space-y-6">
                            <div>
                                <h3 className="mb-3 text-sm font-semibold text-gray-900">Template Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Type:</span>
                                        <p className="text-gray-900">{type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Key:</span>
                                        <p className="font-mono text-xs text-gray-900">{template.key}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">View Path:</span>
                                        <p className="font-mono text-xs text-gray-900">{template.view_path}</p>
                                    </div>
                                </div>
                            </div>

                            {placeholders.length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Available Placeholders</h3>
                                    <div className="max-h-60 space-y-1 overflow-auto rounded-lg bg-gray-50 p-3">
                                        {placeholders.map((placeholder) => (
                                            <div key={placeholder} className="font-mono text-xs text-gray-700">
                                                {placeholder}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {template.customizable_properties && Object.keys(template.customizable_properties).length > 0 && (
                                <div>
                                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Customizable Properties</h3>
                                    <div className="space-y-2">
                                        {Object.entries(template.customizable_properties).map(([key, prop]: [string, any]) => (
                                            <div key={key} className="rounded-lg border border-gray-200 p-2 text-sm">
                                                <div className="font-medium text-gray-900">{prop.label || key}</div>
                                                <div className="text-xs text-gray-500">{prop.type || 'text'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="mb-3 text-sm font-semibold text-gray-900">Editable Labels</h3>
                                {template.editable_labels && Object.keys(template.editable_labels).length > 0 ? (
                                    <div className="max-h-40 space-y-1 overflow-auto">
                                        {Object.entries(template.editable_labels).map(([key, label]: [string, any]) => (
                                            <div key={key} className="rounded-lg bg-gray-50 p-2 text-sm">
                                                <div className="font-mono text-xs text-gray-700">{key}</div>
                                                <div className="text-xs text-gray-500">Default: {typeof label === 'string' ? label : label.default || ''}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No editable labels configured</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col overflow-auto bg-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 text-sm">
                            <span className="font-medium text-gray-700">HTML Preview</span>
                        </div>
                        <div className="flex flex-1 items-center justify-center p-6">
                            <div className="flex h-full w-full max-w-[210mm] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
                                <iframe
                                    src={route('templates.preview', template.key)}
                                    className="h-full w-full flex-1 border-0"
                                    title="HTML Preview"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
