import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { utapi } from '@/app/api/uploadthing/core';

/**
 * Cron job: Cleanup orphaned UploadThing files.
 * Run weekly via Vercel Cron or external scheduler.
 * 
 * This finds files that are no longer referenced in any profile,
 * message, or verification and deletes them from UploadThing.
 * 
 * vercel.json config:
 * { "crons": [{ "path": "/api/cron/cleanup-uploads", "schedule": "0 3 * * 0" }] }
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Collect all referenced UploadThing URLs
        const referencedUrls = new Set<string>();

        // Profile photos
        const profiles = await prisma.profile.findMany({
            select: { photos: true, voiceIntro: true },
        });
        for (const p of profiles) {
            if (p.photos) {
                for (const url of p.photos) {
                    if (url.includes('utfs.io') || url.includes('uploadthing.com')) {
                        referencedUrls.add(url);
                    }
                }
            }
            if (p.voiceIntro && (p.voiceIntro.includes('utfs.io') || p.voiceIntro.includes('uploadthing.com'))) {
                referencedUrls.add(p.voiceIntro);
            }
        }

        // Chat messages with image/voice type
        const mediaMessages = await prisma.message.findMany({
            where: { type: { in: ['image', 'voice'] } },
            select: { content: true },
        });
        for (const msg of mediaMessages) {
            try {
                const parsed = JSON.parse(msg.content);
                const url = parsed.audioUrl || parsed.imageUrl || parsed.url;
                if (url && (url.includes('utfs.io') || url.includes('uploadthing.com'))) {
                    referencedUrls.add(url);
                }
            } catch {
                // Plain text content, skip
            }
        }

        // Verification selfies
        const verifications = await prisma.verificationSubmission.findMany({
            select: { selfieUrl: true },
        });
        for (const v of verifications) {
            if (v.selfieUrl && (v.selfieUrl.includes('utfs.io') || v.selfieUrl.includes('uploadthing.com'))) {
                referencedUrls.add(v.selfieUrl);
            }
        }

        // List all files from UploadThing (paginated)
        const allFiles: string[] = [];
        let page = 0;
        const pageSize = 100;
        let hasMore = true;

        while (hasMore) {
            const result = await utapi.listFiles({ limit: pageSize, offset: page * pageSize });
            if (result.files) {
                for (const file of result.files) {
                    // UTApi returns `key` for file identification, construct URL
                    if (file.key) {
                        allFiles.push(`https://utfs.io/f/${file.key}`);
                    }
                }
                hasMore = result.files.length === pageSize;
            } else {
                hasMore = false;
            }
            page++;
        }

        // Find orphaned files
        const orphanedUrls = allFiles.filter(url => !referencedUrls.has(url));

        // Delete orphaned files (max 50 per run to avoid timeout)
        const toDelete = orphanedUrls.slice(0, 50);
        if (toDelete.length > 0) {
            await utapi.deleteFiles(toDelete);
        }

        return NextResponse.json({
            totalFiles: allFiles.length,
            referencedFiles: referencedUrls.size,
            orphanedFound: orphanedUrls.length,
            deleted: toDelete.length,
        });
    } catch (error) {
        console.error('[cron/cleanup-uploads]', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
