// Supabase Storage Adapter
import { createClient } from '@/lib/supabase/client';

export const storageService = {
    uploadImage: async (file: File | Blob, path: string): Promise<string> => {
        const supabase = createClient();
        const fileName = `${Date.now()}_${path.split('/').pop() || 'image'}`;
        const filePath = `${path}/${fileName}`; // Correct pathing?
        // Actually path usually includes userId: `users/${userId}/photos/${fileName}`

        // We assume 'uploads' bucket or public bucket
        const { data, error } = await supabase.storage
            .from('uploads') // Ensure this bucket exists
            .upload(filePath, file);

        if (error) {
            console.error('Upload error', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    deleteImage: async (url: string) => {
        // Stub
    },

    uploadProfilePhotos: async (userId: string, files: File[]): Promise<string[]> => {
        const urls: string[] = [];
        for (const file of files) {
            try {
                const url = await storageService.uploadImage(file, `users/${userId}/photos`);
                urls.push(url);
            } catch (e) {
                console.error(e);
            }
        }
        return urls;
    }
};
