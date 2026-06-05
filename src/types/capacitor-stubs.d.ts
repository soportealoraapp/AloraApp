declare module '@capacitor/haptics' {
    export const Haptics: {
        impact(options: { style: ImpactStyle }): Promise<void>;
        notification(options: { type: string }): Promise<void>;
    };
    export enum ImpactStyle { Light = 'Light', Medium = 'Medium', Heavy = 'Heavy' }
    export const NotificationType: Record<string, string>;
}

declare module '@capacitor/status-bar' {
    export const StatusBar: {
        setStyle(options: { style: 'DARK' | 'LIGHT' | 'DEFAULT' }): Promise<void>;
        setOverlaysWebView(options: { overlay: boolean }): Promise<void>;
        setBackgroundColor(options: { color: string }): Promise<void>;
    };
}

declare module '@capacitor/push-notifications' {
    export const PushNotifications: {
        register(): Promise<void>;
        getDeliveredNotifications(): Promise<{ notifications: PushNotificationSchema[] }>;
        removeAllDeliveredNotifications(): Promise<void>;
        addListener(eventName: string, callback: (...args: any[]) => void): Promise<any>;
        checkPermissions(): Promise<PermissionStatus>;
        requestPermissions(): Promise<PermissionStatus>;
    };
    export interface PushNotificationSchema {
        id: string;
        title: string;
        body: string;
        data: any;
    }
    export interface PermissionStatus { receive: string; }
    export interface ActionPerformed { actionId: string; inputValue: string; }
}
