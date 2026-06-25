import { ModeToggle } from '@/components/theme/mode-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

const FrontendHeader = () => {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { href: '/', label: 'Home', type: 'link' },
        { href: '#features', label: 'Features', type: 'anchor' },
        { href: '#how-it-works', label: 'How It Works', type: 'anchor' },
        { href: '#who-its-for', label: "Who It's For", type: 'anchor' },
        { href: '#pricing', label: 'Pricing', type: 'anchor' },
        { href: '#faqs', label: 'FAQs', type: 'anchor' },
    ];

    const NavItems = ({ className = '', onClick = () => { } }: { className?: string; onClick?: () => void }) => (
        <>
            {navLinks.map((link) =>
                link.type === 'link' ? (
                    <Link
                        key={link.label}
                        href={link.href}
                        onClick={onClick}
                        className={`transition-smooth text-muted-foreground hover:text-foreground ${className}`}
                    >
                        {link.label}
                    </Link>
                ) : (
                    <a
                        key={link.label}
                        href={link.href}
                        onClick={onClick}
                        className={`transition-smooth text-muted-foreground hover:text-foreground ${className}`}
                    >
                        {link.label}
                    </a>
                ),
            )}
        </>
    );

    return (
        <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Link href="/">
                            <img src="/images/insurepal-logo.png" alt="Insure Pal" width={50} height={50} className="sm:h-[60px] sm:w-[60px]" />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center gap-8 md:flex">
                        <NavItems />
                        <ModeToggle />
                    </div>

                    {/* Desktop/Mobile Auth Buttons & Hamburger */}
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex sm:items-center sm:gap-2">
                            {user ? (
                                <>
                                    <Button size="sm" asChild>
                                        <Link href={route('dashboard')}>Dashboard</Link>
                                    </Button>
                                    <Button size="sm" asChild variant="outline">
                                        <Link href={route('logout')} method="post" as="button" className="flex flex-row">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Logout
                                        </Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/login">Sign In</Link>
                                    </Button>
                                    <Button size="sm" asChild>
                                        <Link href="/register">Get Started</Link>
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Trigger */}
                        <div className="md:hidden">
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-6 w-6" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                    <SheetHeader>
                                        <SheetTitle className="text-left">
                                            <img src="/images/insurepal-logo.png" alt="Insure Pal" width={50} height={50} />
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="mt-8 flex flex-col gap-6 px-3">
                                        <NavItems className="text-lg font-medium w-full text-center" onClick={() => setIsOpen(false)} />
                                        <div className="flex items-center gap-4 border-t pt-6">
                                            <ModeToggle />
                                            <span className="text-sm text-muted-foreground">Toggle Theme</span>
                                        </div>
                                        <div className="flex flex-col gap-3 border-t pt-6">
                                            {user ? (
                                                <>
                                                    <Button asChild className="w-full justify-start">
                                                        <Link href={route('dashboard')} onClick={() => setIsOpen(false)}>
                                                            Dashboard
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="outline" className="w-full justify-start">
                                                        <Link href={route('logout')} method="post" as="button" onClick={() => setIsOpen(false)}>
                                                            <LogOut className="mr-2 h-4 w-4" />
                                                            Logout
                                                        </Link>
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button variant="outline" asChild className="w-full" onClick={() => setIsOpen(false)}>
                                                        <Link href="/login">Sign In</Link>
                                                    </Button>
                                                    <Button asChild className="w-full" onClick={() => setIsOpen(false)}>
                                                        <Link href="/register">Get Started</Link>
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default FrontendHeader;
