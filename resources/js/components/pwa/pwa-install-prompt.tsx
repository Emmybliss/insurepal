import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        setIsVisible(false);
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div
            role="alert"
            aria-live="polite"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9998,
                width: 'min(420px, calc(100vw - 2rem))',
                animation: 'pwa-install-slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
            }}
        >
            <style>{`
                @keyframes pwa-install-slide-up {
                    from { opacity: 0; transform: translateX(-50%) translateY(1rem); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
            <div
                style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    border: '1px solid #334155',
                    borderRadius: '0.875rem',
                    padding: '1rem 1.25rem',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.875rem',
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '0.5rem',
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#a78bfa"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                        style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#f8fafc',
                            lineHeight: 1.3,
                        }}
                    >
                        Install App
                    </p>
                    <p
                        style={{
                            margin: '0.125rem 0 0',
                            fontSize: '0.8125rem',
                            color: '#94a3b8',
                            lineHeight: 1.4,
                        }}
                    >
                        Install InsurePal for a better experience.
                    </p>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                        onClick={handleDismiss}
                        style={{
                            background: 'transparent',
                            border: '1px solid #334155',
                            borderRadius: '0.5rem',
                            padding: '0.4rem 0.6rem',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#475569';
                            (e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#334155';
                            (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                        }}
                    >
                        Later
                    </button>
                    <button
                        onClick={handleInstall}
                        style={{
                            background: '#8b5cf6',
                            border: 'none',
                            borderRadius: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            transition: 'all 0.15s',
                            boxShadow: '0 0 12px rgba(139, 92, 246, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf6';
                        }}
                    >
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
}
