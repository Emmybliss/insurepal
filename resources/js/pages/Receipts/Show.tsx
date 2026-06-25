import { ReceiptDetails } from '@/components/Invoice/ReceiptDetails';
import { Receipt } from '@/types';

interface ShowReceiptProps {
    receipt: Receipt;
    templates: any[];
}

export default function ShowReceipt({ receipt, templates }: ShowReceiptProps) {
    return <ReceiptDetails receipt={receipt} templates={templates} />;
}
