import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll,
} from 'firebase/storage';
import { storage } from './config';

export const storageService = {
    // Upload profile photo
    async uploadProfilePhoto(userId: string, file: File, index: number): Promise<string> {
        const fileExtension = file.name.split('.').pop();
        const fileName = `photo_${index}.${fileExtension}`;
        const storageRef = ref(storage, `users/${userId}/photos/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    },

    // Upload multiple photos
    async uploadProfilePhotos(userId: string, files: File[]): Promise<string[]> {
        const uploadPromises = files.map((file, index) =>
            this.uploadProfilePhoto(userId, file, index)
        );

        return await Promise.all(uploadPromises);
    },

    // Delete photo
    async deletePhoto(photoUrl: string): Promise<void> {
        const photoRef = ref(storage, photoUrl);
        await deleteObject(photoRef);
    },

    // Delete all user photos
    async deleteAllUserPhotos(userId: string): Promise<void> {
        const photosRef = ref(storage, `users/${userId}/photos`);
        const photosList = await listAll(photosRef);

        const deletePromises = photosList.items.map(item => deleteObject(item));
        await Promise.all(deletePromises);
    },

    // Upload verification selfie
    async uploadVerificationSelfie(userId: string, file: File): Promise<string> {
        const storageRef = ref(storage, `users/${userId}/verification/selfie.jpg`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    },

    // Upload verification ID
    async uploadVerificationID(userId: string, file: File): Promise<string> {
        const storageRef = ref(storage, `users/${userId}/verification/id_photo.jpg`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    },

    // Upload chat image
    async uploadChatImage(matchId: string, file: File): Promise<string> {
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}.${fileExtension}`;
        const storageRef = ref(storage, `chats/${matchId}/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        return downloadURL;
    },
};
