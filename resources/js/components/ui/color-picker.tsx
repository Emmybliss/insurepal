import { Check, Pipette } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const PALETTE_COLORS = [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#eab308',
    '#22c55e',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
    '#0ea5e9',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#e11d48',
    '#1e293b',
    '#475569',
];

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
    const [hexInput, setHexInput] = useState(value);
    const [open, setOpen] = useState(false);

    // Sync internal hexInput when parent value changes (e.g. from setData)
    useEffect(() => {
        setHexInput(value);
    }, [value]);

    const handleHexChange = (hex: string) => {
        setHexInput(hex);
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
            onChange(hex);
        }
    };

    const handleSwatchClick = (color: string) => {
        setHexInput(color);
        onChange(color);
        setOpen(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen && !/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
            setHexInput(value);
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn('h-10 w-full justify-start gap-3 px-3')}
                >
                    <div
                        className="h-5 w-5 shrink-0 rounded-full border"
                        style={{ backgroundColor: value }}
                    />
                    <span className="font-mono text-sm">{value}</span>
                    {label && <span className="sr-only">{label}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
                <div className="space-y-3">
                    <div className="grid grid-cols-6 gap-1.5">
                        {PALETTE_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                title={color}
                                className={cn(
                                    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-110',
                                    value === color && 'ring-2 ring-ring ring-offset-1',
                                )}
                                style={{ backgroundColor: color }}
                                onClick={() => handleSwatchClick(color)}
                            >
                                {value === color && (
                                    <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <div
                            className="h-8 w-8 shrink-0 rounded-md border"
                            style={{ backgroundColor: hexInput }}
                        />
                        <div className="relative flex-1">
                            <Pipette className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={hexInput}
                                onChange={(e) => handleHexChange(e.target.value)}
                                placeholder="#000000"
                                className="h-8 pl-7 font-mono text-xs"
                            />
                        </div>
                        <input
                            type="color"
                            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
                            onChange={(e) => handleHexChange(e.target.value)}
                            className="h-8 w-8 cursor-pointer rounded border p-0.5"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
