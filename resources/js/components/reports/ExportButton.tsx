import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonProps {
    reportType: string;
    period?: string;
    className?: string;
}

export function ExportButton({ reportType, period = 'last_30_days', className }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (format: 'pdf' | 'excel') => {
        setIsExporting(true);

        try {
            router.post(
                '/reports/export',
                {
                    report_type: reportType,
                    format: format,
                    period: period,
                },
                {
                    onFinish: () => setIsExporting(false),
                },
            );
        } catch (error) {
            console.error('Export failed:', error);
            setIsExporting(false);
        }
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={isExporting}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
            </Button>
        </div>
    );
}
