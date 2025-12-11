import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.alora.app',
    appName: 'Alora',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    }
};

export default config;
