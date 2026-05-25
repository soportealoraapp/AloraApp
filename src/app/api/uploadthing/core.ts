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

            return { userId: user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", metadata.userId);
            console.log("file url", file.url);
            return { uploadedBy: metadata.userId };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
