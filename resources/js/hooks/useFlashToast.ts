// hooks/useFlashToast.ts
import { usePage } from '@inertiajs/react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { Bounce, toast } from 'react-toastify';

export default function useFlashToast() {
    const { flash } = usePage().props as {
        flash?: {
            success?: string;
            error?: string;
        };
    };

    useEffect(() => {
        if (flash?.success) {
            // ✅ Fire confetti
            confetti({
                particleCount: 200,
                spread: 70,
                origin: { y: 0.6 },
            });
            // Show error message
            toast.success(flash.success, {
                position: 'top-right',
                autoClose: 3000,
                theme: 'light',
                transition: Bounce,
            });
        }
        if (flash?.error)
            toast.error(flash.error, {
                position: 'top-center',
                autoClose: 3000,
                theme: 'light',
                transition: Bounce,
            });
    }, [flash]);
}
