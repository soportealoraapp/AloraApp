'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface StoryCircleProps {
    photo: string;
    name: string;
    hasUnviewed: boolean;
    isOwn?: boolean;
    onClick: () => void;
}

export function StoryCircle({ photo, name, hasUnviewed, isOwn, onClick }: StoryCircleProps) {
    return (
        <button
            onClick={onClick}
            className="flex flex-col items-center gap-1 flex-shrink-0"
        >
            <div className={cn(
                "rounded-full p-0.5",
                hasUnviewed ? "bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400" : "bg-muted",
                isOwn && "bg-gradient-to-br from-gray-300 to-gray-400"
            )}>
                <div className="rounded-full p-0.5 bg-background">
                    <Avatar className="h-14 w-14 border-2 border-background">
                        <AvatarImage src={photo} alt={name} />
                        <AvatarFallback>{name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                </div>
            </div>
            <span className="text-[10px] text-muted-foreground max-w-[60px] truncate">
                {isOwn ? 'Tu historia' : name}
            </span>
        </button>
    );
}
