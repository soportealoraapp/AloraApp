import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const firebaseConfig = {
    apiKey: "REPLACED_BY_BUILD_OR_ENV",
    authDomain: "REPLACED_BY_BUILD_OR_ENV",
    projectId: "REPLACED_BY_BUILD_OR_ENV",
    storageBucket: "REPLACED_BY_BUILD_OR_ENV",
    messagingSenderId: "REPLACED_BY_BUILD_OR_ENV",
    appId: "REPLACED_BY_BUILD_OR_ENV",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
