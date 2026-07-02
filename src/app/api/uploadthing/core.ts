import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UTApi } from "uploadthing/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const utapi = new UTApi();

const f = createUploadthing({
    errorFormatter: (err) => {
        return { message: err.data?.message ?? 'Upload error' };
    },
});

async function resolveUserId(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) return user.id;

    throw new Error("Unauthorized: se requiere una sesión válida de Supabase");
}

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 6 } })
        .middleware(async ({ req }) => {
            const userId = await resolveUserId(req);
            return { userId, type: 'profile' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { uploadedBy: metadata.userId };
        }),

    chatImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
        .middleware(async ({ req }) => {
            const userId = await resolveUserId(req);
            return { userId, type: 'chat' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploadedBy: metadata.userId,
                url: (file as any).ufsUrl ?? (file as any).url,
                type: 'image',
            };
        }),

    verificationUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const userId = await resolveUserId(req);
            return { userId, type: 'verification' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return { uploadedBy: metadata.userId, url: (file as any).ufsUrl ?? (file as any).url };
        }),

    voiceUploader: f({ audio: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(async ({ req }) => {
            const userId = await resolveUserId(req);
            return { userId, type: 'voice' };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            return {
                uploadedBy: metadata.userId,
                url: (file as any).ufsUrl ?? (file as any).url,
                type: 'voice',
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
