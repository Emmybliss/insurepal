import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ApprovalCardProps {
    toolName: string;
    parameters: Record<string, unknown>;
    onApprove: () => void;
    onReject: () => void;
    isProcessing?: boolean;
}

export function ApprovalCard({ toolName, parameters, onApprove, onReject, isProcessing }: ApprovalCardProps) {
    return (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                    Action Required
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">This action requires your approval before it can be executed.</p>
                <div className="rounded-md bg-background p-3">
                    <p className="text-sm font-medium">Tool: {toolName}</p>
                    <pre className="mt-2 overflow-auto text-xs text-muted-foreground">{JSON.stringify(parameters, null, 2)}</pre>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={onReject} disabled={isProcessing}>
                    <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button onClick={onApprove} disabled={isProcessing}>
                    <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
            </CardFooter>
        </Card>
    );
}
