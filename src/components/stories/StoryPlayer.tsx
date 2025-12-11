'use client';

import { useState, useRef } from 'react';
import { X, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StoryPlayer({ stories, onClose }: { stories: any[], onClose: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentStory = stories[currentIndex];

    if (!currentStory) return null;

    const handleNext = () => {
        if (currentIndex < stories.length - 1) setCurrentIndex(prev => prev + 1);
        else onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            <div className="relative w-full max-w-sm h-full max-h-[800px] bg-gray-900 rounded-lg overflow-hidden">
                <Button className="absolute top-4 right-4 z-20 text-white" variant="ghost" onClick={onClose}>
                    <X />
                </Button>

                {/* Simulated Video Player */}
                <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center text-white" onClick={handleNext}>
                    {/* In real implementation: <video src={currentStory.videoUrl} /> */}
                    <span className="text-2xl font-bold animate-pulse">Story #{currentIndex + 1}</span>
                </div>

                {/* Overlays */}
                <div className="absolute bottom-8 left-0 right-0 px-4 flex justify-between items-end">
                    <div className="text-white">
                        <p className="font-bold text-sm">@{currentStory.userId}</p>
                        <p className="text-xs opacity-80">Hace 2 horas</p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                            <Heart className="w-6 h-6" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
                            <MessageCircle className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
