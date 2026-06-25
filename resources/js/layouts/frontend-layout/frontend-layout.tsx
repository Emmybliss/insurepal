import { SidebarProvider } from '@/components/ui/sidebar';
import WhatsAppChat from '@/components/WhatsappChat';
import FrontendFooter from './frontend-footer';
import FrontendHeader from './frontend-header';
interface FrontendLayoutProps {
    children: React.ReactNode;
}

export function FrontendLayout({ children }: FrontendLayoutProps) {
    return (
        <SidebarProvider>
            <main className="min-h-screen w-full bg-background">
                <FrontendHeader />

                {children}
                <FrontendFooter />
                <WhatsAppChat />
            </main>
        </SidebarProvider>
    );
}
