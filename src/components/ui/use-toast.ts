// Toast hook wrapper - uses native browser notifications or console as fallback
// This is a minimal implementation to prevent build errors

type ToastOptions = {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
};

export function toast(options: ToastOptions | string) {
    const message = typeof options === 'string' ? options : options.description || options.title || '';
    console.log('[Toast]', message);
}

export function useToast() {
    return {
        toast,
        dismiss: () => { },
    };
}
