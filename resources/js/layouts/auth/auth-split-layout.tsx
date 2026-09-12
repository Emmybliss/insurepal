import AppLogoIcon from '@/components/app-logo-icon';
import { AuthSlider } from '@/components/auth/AuthSlider';
import { Card, CardContent } from '@/components/ui/card';
import { Link, usePage } from '@inertiajs/react';
import slide3Image from 'images/slides/slide3.jpg';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { auth } = usePage<{ auth: any }>().props;
    const tenant = auth?.tenant;

    const displayDescription = description || (tenant ? `Access your ${tenant.name} portal` : undefined);

    const renderHeader = () => {
        if (tenant?.logo_url) {
            return (
                <div className="flex flex-col items-center justify-center pt-2">
                    <img src={tenant.logo_url} alt={tenant.name} className="h-16 w-auto max-w-[220px] object-contain  rounded-xl" />
                    <span className="mt-1.5 text-base font-semibold text-foreground">{tenant.name}</span>
                    {tenant.slogan && <span className="text-xs text-muted-foreground">{tenant.slogan}</span>}
                </div>
            );
        }

        return (
            <Link href="/" className="relative z-20 flex flex-col items-center justify-center pt-2">
                <AppLogoIcon className="h-12 w-14 sm:h-12 rounded-xl" />
                {tenant?.name && <span className="mt-1 text-sm font-semibold text-foreground">{tenant.name}</span>}
            </Link>
        );
    };

    return (
        <>
            {/* <ToastContainer /> */}
            <div className="grid grid-cols-1 overflow-hidden md:grid md:grid-cols-2">
                <div className="hidden h-full w-full overflow-hidden bg-gradient-to-r from-cyan-950 to-blue-300 md:block">
                    <AuthSlider />
                </div>

                {/* Desktop */}
                <div className="hidden min-h-screen w-full flex-col items-center justify-center bg-gray-100 p-6 pt-0 md:flex md:overflow-hidden">
                    <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden md:pt-7">
                        <Card className="w-full max-w-md shadow-lg">
                            {renderHeader()}
                            <div className="flex flex-col items-center gap-1.5 text-center px-4 pt-2">
                                {title && <h1 className="text-xl font-medium">{title}</h1>}
                                {displayDescription && <p className="text-sm text-balance text-muted-foreground">{displayDescription}</p>}
                            </div>
                            <CardContent>{children}</CardContent>
                        </Card>
                    </div>
                </div>

                {/* Mobile */}
                <div
                    className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 bg-cover bg-center p-6 pt-0 md:hidden"
                    style={{ backgroundImage: `url(${slide3Image})` }}
                >
                    <Card className="w-full max-w-md shadow-lg">
                        {renderHeader()}
                        <div className="flex flex-col items-center gap-1.5 text-center px-4 pt-2">
                            {title && <h1 className="text-xl font-medium">{title}</h1>}
                            {displayDescription && <p className="text-sm text-balance text-muted-foreground">{displayDescription}</p>}
                        </div>
                        <CardContent>{children}</CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
