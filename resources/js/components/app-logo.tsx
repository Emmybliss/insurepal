import type { Auth } from '@/types/core';
import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const tenantBrand = auth?.tenant;

    const logoSrc = tenantBrand?.logo_url ?? '/images/insurepal-logo.png';
    const logoAlt = tenantBrand?.name ?? 'Insure Pal';
    const slogan = tenantBrand?.slogan ?? 'Your Insurance Partner';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md shadow-2xl">
                <img src={logoSrc} alt={logoAlt} width={100} height={100} className="object-cover" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="mb-0.5 truncate text-lg leading-tight font-semibold">{logoAlt}</span>
                <span className="mb-0.5 truncate text-xs leading-tight">{slogan}</span>
            </div>
        </>
    );
}
