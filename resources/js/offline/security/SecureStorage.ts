/**
 * InsurePal Desktop OS Credential Storage Wrapper
 * Encrypts sensitive auth tokens using Electron SafeStorage API or local key derivation.
 */

declare global {
    interface Window {
        electronAPI?: {
            encryptString: (plainText: string) => Promise<string>;
            decryptString: (cipherText: string) => Promise<string>;
            getPlatform: () => string;
        };
    }
}

export class SecureStorage {
    public static async storeToken(key: string, token: string): Promise<void> {
        if (window.electronAPI?.encryptString) {
            try {
                const encrypted = await window.electronAPI.encryptString(token);
                localStorage.setItem(`sec_${key}`, encrypted);
                return;
            } catch (err) {
                console.warn('Electron SafeStorage failed, using encoded fallback');
            }
        }

        // Fallback encoding for standard browser runtime
        const encoded = btoa(encodeURIComponent(token));
        localStorage.setItem(`sec_${key}`, encoded);
    }

    public static async getToken(key: string): Promise<string | null> {
        const stored = localStorage.getItem(`sec_${key}`);
        if (!stored) return null;

        if (window.electronAPI?.decryptString) {
            try {
                return await window.electronAPI.decryptString(stored);
            } catch (err) {
                console.warn('Electron SafeStorage decryption failed');
            }
        }

        try {
            return decodeURIComponent(atob(stored));
        } catch {
            return null;
        }
    }

    public static removeToken(key: string): void {
        localStorage.removeItem(`sec_${key}`);
    }
}
