export const isBrowser = () => typeof window !== 'undefined';

export const safeLocalStorage = {
    get(key: string, fallback: string | null = null) {
        if (!isBrowser()) return fallback;
        try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    },
    set(key: string, value: string) {
        if (!isBrowser()) return;
        try { window.localStorage.setItem(key, value); } catch { }
    },
    remove(key: string) {
        if (!isBrowser()) return;
        try { window.localStorage.removeItem(key); } catch { }
    },
};
