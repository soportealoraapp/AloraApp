'use client';

import { VoiceMessage } from '@/components/chat/VoiceMessage';
import { MessageBubble } from '@/components/chat/message-bubble';
import type { Message } from '@/lib/domain/types';

interface MessageRendererProps {
    message: Message;
    isMe: boolean;
    currentUserId?: string;
    onReact: (messageId: string, emoji: string) => void;
    onRetry: (failedMessage: Message) => void;
}

function normalizeContent(content: string | object): string {
    return typeof content === 'string' ? content : JSON.stringify(content);
}

export function MessageRenderer({
    message,
    isMe,
    currentUserId,
    onReact,
    onRetry,
}: MessageRendererProps) {
    if (message.type === 'voice') {
        try {
            const voiceData = typeof message.content === 'string'
                ? JSON.parse(message.content)
                : message.content;
            if (voiceData && typeof voiceData === 'object' && voiceData.audioUrl) {
                return (
                    <VoiceMessage
                        audioUrl={voiceData.audioUrl}
                        duration={voiceData.duration}
                        isOwn={isMe}
                    />
                );
            }
        } catch {}
    }

    return (
        <MessageBubble
            message={{
                ...message,
                content: normalizeContent(message.content),
            }}
            isMe={isMe}
            currentUserId={currentUserId}
            onReact={onReact}
            onRetry={onRetry}
        />
    );
}
