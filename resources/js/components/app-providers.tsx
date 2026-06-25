import { ThemeProvider as TenantThemeProvider } from '@/contexts/theme-context';
import { ReactNode } from 'react';

/**
 * App-level providers that need access to Inertia context
 * This component is used inside the Inertia App component
 */
export function AppProviders({ children }: { children: ReactNode }) {
    return <TenantThemeProvider>{children}</TenantThemeProvider>;
}
