import { Link } from '@inertiajs/react';

const FrontendFooter = () => {
    return (
        <div>
            {' '}
            {/* Footer */}
            <footer className="border-t border-border bg-card py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        <div className="space-y-4">
                            <Link href="/">
                                <img src="/images/insurepal-logo.png" alt="Insure Pal" width={60} height={60} />
                            </Link>

                            <p className="text-muted-foreground">Modern insurance management platform built for Nigerian brokers and underwriters.</p>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold text-foreground">Product</h4>
                            <div className="space-y-2">
                                <a href="#features" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Features
                                </a>
                                <a href="#pricing" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Pricing
                                </a>
                                <a href="#" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Integrations
                                </a>
                                <a href="#" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    API
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold text-foreground">Company</h4>
                            <div className="space-y-2">
                                <a href="#" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    About
                                </a>
                                <a href="#" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Careers
                                </a>
                                <a href="#" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Contact
                                </a>
                                <a href="#" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Blog
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 font-semibold text-foreground">Support</h4>
                            <div className="space-y-2">
                                <a href="#" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Help Center
                                </a>
                                <a href="#" className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Documentation
                                </a>
                                <Link href={route('privacy-policy')} className="transition-smooth block text-muted-foreground hover:text-foreground">
                                    Privacy Policy
                                </Link>
                                <Link
                                    href={route('terms-conditions')}
                                    className="transition-smooth block text-muted-foreground hover:text-foreground"
                                >
                                    Terms of Service
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex flex-col items-center justify-between border-t border-border pt-8 md:flex-row">
                        <p className="text-sm text-muted-foreground">© 2026 InsurePal. All rights reserved.</p>
                        <div className="mt-4 flex items-center gap-4 md:mt-0">
                            <a href="#" className="transition-smooth text-muted-foreground hover:text-primary">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>
                            <a href="#" className="transition-smooth text-muted-foreground hover:text-primary">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default FrontendFooter;
