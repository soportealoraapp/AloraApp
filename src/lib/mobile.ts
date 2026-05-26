'use client';

/**
 * Capacitor mobile utilities for native app features.
 * Safely handles cases where Capacitor is not available (web fallback).
 */

let Capacitor: any = null;
let isNative = false;

if (typeof window !== 'undefined') {
    try {
        // Dynamic import to avoid build errors when Capacitor is not installed
        const cap = require('@capacitor/core');
        Capacitor = cap;
        isNative = Capacitor.isNativePlatform();
    } catch {
        isNative = false;
    }
}

export function isNativePlatform(): boolean {
    return isNative;
}

// ========== HAPTICS ==========

export async function hapticsLight() {
    if (!isNative) return;
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
}

export async function hapticsMedium() {
    if (!isNative) return;
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
}

export async function hapticsHeavy() {
    if (!isNative) return;
    try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {}
}

export async function hapticsNotification(type: 'success' | 'warning' | 'error') {
    if (!isNative) return;
    try {
        const { Haptics, NotificationType } = await import('@capacitor/haptics');
        await Haptics.notification({ type: NotificationType[type.toUpperCase() as keyof typeof NotificationType] });
    } catch {}
}

// ========== STATUS BAR ==========

export async function setStatusBarStyle(style: 'DARK' | 'LIGHT') {
    if (!isNative) return;
    try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style });
    } catch {}
}

export async function setStatusBarBackgroundColor(color: string) {
    if (!isNative) return;
    try {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setBackgroundColor({ color });
    } catch {}
}

// ========== KEYBOARD ==========

export function setupKeyboardListeners(onShow?: () => void, onHide?: () => void) {
    if (!isNative) return () => {};
    try {
        const Keyboard = require('@capacitor/keyboard');
        const showListener = Keyboard.addListener('keyboardWillShow', () => onShow?.());
        const hideListener = Keyboard.addListener('keyboardWillHide', () => onHide?.());
        return () => {
            showListener?.remove();
            hideListener?.remove();
        };
    } catch {
        return () => {};
    }
}

// ========== BACK BUTTON ==========

export function setupBackButton(handler: () => void) {
    if (!isNative) return () => {};
    try {
        const { App } = require('@capacitor/app');
        const listener = App.addListener('backButton', () => handler());
        return () => listener?.remove();
    } catch {
        return () => {};
    }
}

// ========== APP STATE ==========

export function setupAppStateListeners(onBackground?: () => void, onForeground?: () => void) {
    if (!isNative) return () => {};
    try {
        const { App } = require('@capacitor/app');
        const bgListener = App.addListener('appStateChange', (state: { isActive: boolean }) => {
            if (state.isActive) onForeground?.();
            else onBackground?.();
        });
        return () => {
            bgListener?.remove();
        };
    } catch {
        return () => {};
    }
}

// ========== PUSH NOTIFICATIONS ==========

export async function registerPushNotifications() {
    if (!isNative) return null;
    try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') return null;

        await PushNotifications.register();
        return PushNotifications;
    } catch {
        return null;
    }
}

export async function getPushToken(): Promise<string | null> {
    if (!isNative) return null;
    try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        return new Promise((resolve) => {
            PushNotifications.addListener('registration', (token: { value: string }) => {
                resolve(token.value);
            });
            PushNotifications.addListener('registrationError', () => resolve(null));
            // Also try to get existing token
            setTimeout(() => resolve(null), 5000);
        });
    } catch {
        return null;
    }
}
