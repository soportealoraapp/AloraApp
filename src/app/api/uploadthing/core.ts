import { createUploadthing, type FileRouter } from "uploadthing/next";
import { createClient } from "@/lib/supabase/server";

const f = createUploadthing({
    errorFormatter: (err) => {
        return { message: err.message };
    },
});

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 6 } })
        .middleware(async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("Unauthorized: You must be logged in to upload files");
            }

            return { userId: user.id, type: 'profile' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Profile upload complete for userId:", metadata.userId);
            return { uploadedBy: metadata.userId };
        }),

    chatImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
        .middleware(async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("Unauthorized");
            }

            return { userId: user.id, type: 'chat' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Chat image upload complete for userId:", metadata.userId);
            return {
                uploadedBy: metadata.userId,
                url: file.url,
                type: 'image',
            };
        }),

    verificationUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
        .middleware(async () => {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("Unauthorized");
            }

            return { userId: user.id, type: 'verification' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Verification upload complete for userId:", metadata.userId);
            return { uploadedBy: metadata.userId, url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
