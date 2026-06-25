import { useAuth } from '@/hooks/use-permissions';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import React from 'react';

interface Props {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AdminLayout({ children, breadcrumbs = [] }: Props) {
    const auth = useAuth();
    const superAdminRole = auth.isSuperAdmin;

    // Ensure only super admins can access this layout
    if (!superAdminRole) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <h1 className="mb-4 text-2xl font-bold text-red-600">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access this area.</p>
                </div>
            </div>
        );
    }

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            <main className="px-4 pt-4 md:px-8">{children}</main>
        </AppSidebarLayout>
    );
}
