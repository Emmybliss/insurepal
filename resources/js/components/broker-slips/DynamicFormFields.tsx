import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'textarea';
    required?: boolean;
    options?: Array<{ label: string; value: string }>;
}

interface Props {
    fields: FormField[];
    values: Record<string, any>;
    onChange: (key: string, value: any) => void;
    errors?: Record<string, string>;
}

export default function DynamicFormFields({ fields, values, onChange, errors }: Props) {
    if (!fields || fields.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => {
                const errorKey = `dynamic_fields.${field.key}`;
                const error = errors?.[errorKey];
                const value = values?.[field.key] ?? '';

                return (
                    <div key={field.key}>
                        <Label>
                            {field.label}
                            {field.required && <span className="ml-1 text-red-500">*</span>}
                        </Label>

                        {field.type === 'select' && field.options ? (
                            <Select value={String(value)} onValueChange={(v) => onChange(field.key, v)}>
                                <SelectTrigger className={error ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={`Select ${field.label}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : field.type === 'textarea' ? (
                            <textarea
                                className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''}`}
                                value={value as string}
                                onChange={(e) => onChange(field.key, e.target.value)}
                                placeholder={field.label}
                            />
                        ) : (
                            <Input
                                type={field.type === 'number' ? 'number' : 'text'}
                                step={field.type === 'number' ? '0.01' : undefined}
                                value={value as string}
                                onChange={(e) => onChange(field.key, field.type === 'number' ? e.target.value : e.target.value)}
                                className={error ? 'border-red-500' : ''}
                                placeholder={field.label}
                            />
                        )}

                        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                    </div>
                );
            })}
        </div>
    );
}
