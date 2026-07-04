'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageReactionsProps {
    reactions: Record<string, string>;
    currentUserId: string;
    onReact: (emoji: string) => void;
    isMe?: boolean;
}

const AVAILABLE_REACTIONS = ['❤️', '😂', '🔥', '😮', '👏', '🥹'];

export function MessageReactions({ reactions, currentUserId, onReact, isMe = false }: MessageReactionsProps) {
    const [showPicker, setShowPicker] = useState(false);

    const reactionEntries = Object.entries(reactions);
    const myReaction = reactions[currentUserId];

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowPicker(false);
    }, []);

    useEffect(() => {
        if (showPicker) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [showPicker, handleKeyDown]);

    return (
        <div className={cn("relative flex flex-col", isMe ? "items-end" : "items-start")}>
            {reactionEntries.length > 0 && (
                <div className={cn("flex flex-wrap gap-1 mt-1", isMe ? "justify-end" : "justify-start")}>
                    {Object.entries(
                        reactionEntries.reduce((acc, [userId, emoji]) => {
                            acc[emoji] = (acc[emoji] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    ).map(([emoji, count]) => (
                        <button
                            key={emoji}
                            onClick={() => onReact(emoji)}
                            aria-label={`Reaccionar con ${emoji}${count > 1 ? `, ${count} personas` : ''}`}
                            className={cn(
                                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors",
                                myReaction === emoji
                                    ? "bg-primary/20 border border-primary/30"
                                    : "bg-muted hover:bg-muted/80"
                             )}
                        >
                            <span>{emoji}</span>
                            {count > 1 && <span className="text-xs text-muted-foreground">{count}</span>}
                        </button>
                    ))}
                </div>
            )}

            <div className="relative">
                <button
                    onClick={() => setShowPicker(!showPicker)}
                    aria-expanded={showPicker}
                    aria-label="Agregar reacción"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                    {reactionEntries.length === 0 ? '+' : ''}
                </button>

                <AnimatePresence>
                    {showPicker && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 5 }}
                                role="menu"
                                aria-label="Reacciones disponibles"
                                className={cn(
                                    "absolute bottom-full mb-1 z-50 bg-card border border-border rounded-full shadow-lg px-2 py-1 flex gap-1",
                                    isMe ? "right-0" : "left-0"
                                )}
                            >
                                {AVAILABLE_REACTIONS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        role="menuitem"
                                        onClick={() => {
                                            onReact(emoji);
                                            setShowPicker(false);
                                        }}
                                        className={cn(
                                            "w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-lg",
                                            myReaction === emoji && "bg-primary/20"
                                        )}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
