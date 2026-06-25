import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = 'USD', locale: string = 'en-US'): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (Number.isNaN(value)) return '—';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatDate(
    date: string | Date | null | undefined,
    locale: string = 'en-US',
    options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: '2-digit' },
): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale, options);
}
export function formatDateTime(
    date: string | Date | null | undefined,
    locale: string = 'en-US',
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    },
): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(locale, options);
}

export function toDateInputValue(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

/**
 * Compress a base64 data URL image to a JPEG Blob with specified quality
 * @param base64Data - The base64 data URL (e.g., "data:image/png;base64,...")
 * @param quality - JPEG quality from 0.0 to 1.0 (default: 0.7)
 * @returns Promise<Blob> - The compressed image as a Blob
 */
export async function compressImage(base64Data: string, quality: number = 0.7): Promise<Blob> {
    try {
        // Create an image element to load the base64 data
        const img = new Image();
        img.crossOrigin = 'anonymous';

        // Create a promise to handle the image loading
        const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image from base64 data'));
        });

        // Load the image
        img.src = base64Data;
        const loadedImg = await imageLoadPromise;

        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Set canvas dimensions to match the image
        canvas.width = loadedImg.naturalWidth;
        canvas.height = loadedImg.naturalHeight;

        // Draw the image onto the canvas
        ctx.drawImage(loadedImg, 0, 0);

        // Convert canvas to JPEG Blob with compression
        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert canvas to blob'));
                    }
                },
                'image/jpeg',
                quality,
            );
        });
    } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback: convert base64 to blob without compression
        return base64ToBlob(base64Data);
    }
}

/**
 * Convert base64 data URL to Blob (fallback function)
 * @param base64Data - The base64 data URL
 * @returns Blob - The image as a Blob
 */
function base64ToBlob(base64Data: string): Blob {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
}

/**
 * Convert a Blob to base64 data URL
 * @param blob - The Blob to convert
 * @returns Promise<string> - The base64 data URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert blob to base64'));
        reader.readAsDataURL(blob);
    });
}
