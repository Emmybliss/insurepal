import AppLogoIcon from '@/components/app-logo-icon';
import { AuthSlider } from '@/components/auth/AuthSlider';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import slide3Image from 'images/slides/slide3.jpg';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
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
                            <Link href="/" className="relative z-20 flex items-center justify-center">
                                <AppLogoIcon className="h-12 w-14 sm:h-12" />
                            </Link>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-sm text-balance text-muted-foreground">{description}</p>
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
                        <Link href="/" className="relative z-20 flex items-center justify-center">
                            <AppLogoIcon className="h-12 w-14 sm:h-12" />
                        </Link>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-sm text-balance text-muted-foreground">{description}</p>
                        </div>
                        <CardContent>{children}</CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
