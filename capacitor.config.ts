import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.alora.app',
    appName: 'Alora',
    webDir: 'out',
    server: {
        androidScheme: 'https',
    },
    android: {
        backgroundColor: '#1a1215',
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: process.env.NODE_ENV === 'development',
    },
    plugins: {
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        SplashScreen: {
            launchShowDuration: 1000,
            backgroundColor: '#1a1215',
            androidSplashResourceName: 'splash',
            showSpinner: false,
        },
        StatusBar: {
            overlaysWebView: false,
            style: 'DARK',
            backgroundColor: '#1a1215',
        },
        Keyboard: {
            resize: 'body',
            style: 'DARK',
            resizeOnFullScreen: true,
        },
        Haptics: {
            notificationDuration: 300,
            clickDuration: 50,
        },
    },
};

export default config;
