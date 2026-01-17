import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 6 } })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Upload complete for userId:", "anonymous-for-now");
            console.log("file url", file.url);
            return { uploadedBy: "anonymous" };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
