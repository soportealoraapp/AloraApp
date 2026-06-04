import { createUploadthing, type FileRouter } from "uploadthing/next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const f = createUploadthing({
    errorFormatter: (err) => {
        return { message: err.message };
    },
});

async function resolveUserId(req: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) return session.user.id;

    throw new Error("Unauthorized: se requiere una sesión válida de Supabase");
}

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 6 } })
        .middleware(async ({ req }) => {
            const userId = await resolveUserId(req);
            return { userId, type: 'profile' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Profile upload complete for userId:", metadata.userId);
            return { uploadedBy: metadata.userId };
        }),

    chatImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
        .middleware(async ({ req }) => {
            const userId = await resolveUserId(req);
            return { userId, type: 'chat' };
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
        .middleware(async ({ req }) => {
            const userId = await resolveUserId(req);
            return { userId, type: 'verification' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Verification upload complete for userId:", metadata.userId);
            return { uploadedBy: metadata.userId, url: file.url };
        }),

    voiceUploader: f({ blob: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const userId = await resolveUserId(req);
            return { userId, type: 'voice' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Voice upload complete for userId:", metadata.userId);
            return {
                uploadedBy: metadata.userId,
                url: file.url,
                type: 'voice',
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
