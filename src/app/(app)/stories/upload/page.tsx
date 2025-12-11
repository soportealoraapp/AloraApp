'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import { uploadStory } from '@/server/actions/stories/actions';

export default function StoryUploadPage() {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        setUploading(true);
        // Mock upload process
        await new Promise(r => setTimeout(r, 1000));
        await uploadStory({
            userId: 'current_user',
            videoUrl: 'https://mock.url/story.mp4',
            thumbnailUrl: 'https://mock.url/thumb.jpg',
            visibility: 'public',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        setUploading(false);
        alert('Story subida con éxito (Mock)');
    };

    return (
        <div className="p-6 bg-black min-h-screen text-white flex flex-col items-center justify-center">
            <Card className="w-full max-w-sm p-8 bg-zinc-900 border-zinc-800 text-center space-y-6">
                <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto flex items-center justify-center text-pink-500">
                    <Upload size={32} />
                </div>
                <h1 className="text-xl font-bold">Subir Historia</h1>
                <p className="text-gray-400 text-sm">Comparte un momento de 60s. Desaparece en 24h.</p>

                <Button className="w-full bg-pink-600 hover:bg-pink-700" onClick={handleUpload} disabled={uploading}>
                    {uploading ? 'Subiendo...' : 'Seleccionar Video'}
                </Button>
            </Card>
        </div>
    );
}
