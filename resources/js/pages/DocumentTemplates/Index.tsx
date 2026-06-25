import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle, Edit, Eye, FileText, Star } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateConfig {
    label: string;
    type: string;
    view_path: string;
    preview_image?: string | null;
    supported_placeholders?: string[];
    customizable_properties?: Record<string, any>;
    editable_labels?: Record<string, any>;
}

interface IndexProps {
    templates: Record<string, TemplateConfig>;
    documentTypes: Record<string, string>;
    defaults: Record<string, string>;
}

const typeColors: Record<string, string> = {
    certificate: 'bg-blue-100 text-blue-800',
    invoice: 'bg-green-100 text-green-800',
    debit_note: 'bg-orange-100 text-orange-800',
    credit_note: 'bg-purple-100 text-purple-800',
    receipt: 'bg-pink-100 text-pink-800',
    broker_slip: 'bg-amber-100 text-amber-800',
};

export default function Index({ templates, documentTypes, defaults }: IndexProps) {
    const grouped = Object.entries(templates).reduce(
        (acc, [key, tmpl]) => {
            const type = tmpl.type || 'other';
            if (!acc[type]) acc[type] = [];
            acc[type].push({ key, ...tmpl });
            return acc;
        },
        {} as Record<string, Array<{ key: string } & TemplateConfig>>,
    );

    const handleSetDefault = (key: string) => {
        router.post(route('templates.set-default', key), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Default template updated'),
            onError: () => toast.error('Failed to set default template'),
        });
    };

    const handleRemoveDefault = (key: string) => {
        router.post(route('templates.remove-default', key), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Default template removed'),
            onError: () => toast.error('Failed to remove default template'),
        });
    };

    return (
        <AppLayout>
            <Head title="Document Templates" />

            <div className="space-y-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-tracking-light text-3xl font-bold">Document Templates</h1>
                        <p className="text-muted-foreground">
                            Preview, customize, and set default Blade templates for all document types
                        </p>
                    </div>
                </div>

                {Object.keys(templates).length === 0 ? (
                    <div className="rounded-lg p-12 text-center shadow">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="text-tracking-light mt-4 text-lg font-medium">No templates configured</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Add templates to <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">config/document-templates.php</code>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {Object.entries(grouped).map(([type, typeTemplates]) => (
                            <div key={type}>
                                <div className="mb-4 flex items-center gap-2">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {documentTypes[type] || type}
                                    </h2>
                                    {defaults[type] && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
                                            <CheckCircle className="h-3 w-3" />
                                            Default set
                                        </span>
                                    )}
                                    {!defaults[type] && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-500">
                                            No default
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {typeTemplates.map((tmpl) => {
                                        const isDefault = defaults[tmpl.type] === tmpl.key;
                                        return (
                                            <div
                                                key={tmpl.key}
                                                className={`rounded-lg border shadow-sm hover:shadow-md ${isDefault ? 'ring-2 ring-green-400' : 'border-gray-200'}`}
                                            >
                                                {isDefault && (
                                                    <div className="flex items-center gap-1.5 rounded-t-lg bg-green-50 px-4 py-1.5 text-xs font-medium text-green-700 border-b border-green-200">
                                                        <Star className="h-3 w-3 fill-green-600" />
                                                        Default {documentTypes[tmpl.type] || tmpl.type} Template
                                                    </div>
                                                )}
                                                <div className="h-90 bg-white">
                                                    <iframe
                                                        src={route('templates.preview', tmpl.key)}
                                                        className="h-full w-full border-0"
                                                        title={tmpl.label}
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="border-t border-gray-200 p-4">
                                                    <div className="mb-3 flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold text-gray-900">{tmpl.label}</h3>
                                                            <p className="mt-1 text-xs text-gray-500 font-mono">{tmpl.key}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-3 flex flex-wrap gap-2">
                                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeColors[tmpl.type] || 'bg-gray-100 text-gray-800'}`}>
                                                            {tmpl.type}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex gap-2">
                                                            <Link
                                                                href={route('templates.show', tmpl.key)}
                                                                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                Preview
                                                            </Link>
                                                            <Link
                                                                href={route('templates.edit', tmpl.key)}
                                                                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                Customize
                                                            </Link>
                                                        </div>
                                                        {isDefault ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRemoveDefault(tmpl.key)}
                                                                className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                                            >
                                                                Remove Default
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleSetDefault(tmpl.key)}
                                                                className="w-full"
                                                            >
                                                                Set as Default
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
