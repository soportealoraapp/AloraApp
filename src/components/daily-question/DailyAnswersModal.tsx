'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Sparkles, Users, X, MapPin, Heart } from 'lucide-react';
import { HeartArrow } from '@/components/ui/custom/HeartArrow';
import { SafeImage } from '@/components/ui/safe-image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface AnswerProfile {
    userId: string;
    displayName: string;
    age?: number;
    city?: string;
    isVerified?: boolean;
    photos?: string[];
}

export interface OtherAnswer {
    id: string;
    userId: string;
    answer: string;
    profile: AnswerProfile;
}

const cardVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 200 : -200,
        opacity: 0,
        scale: 0.9,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 200 : -200,
        opacity: 0,
        scale: 0.9,
    }),
};

interface DailyAnswersModalProps {
    open: boolean;
    onClose: () => void;
    question: string;
    loading: boolean;
    answers: OtherAnswer[];
    onLike: (userId: string) => void;
    onSuperlike: (userId: string) => void;
    onPass: (userId: string) => void;
}

export function DailyAnswersModal({
    open,
    onClose,
    question,
    loading,
    answers,
    onLike,
    onSuperlike,
    onPass,
}: DailyAnswersModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        if (open) {
            setCurrentIndex(0);
            setDirection(0);
        }
    }, [open]);

    const currentAnswer = answers[currentIndex];

    if (!currentAnswer) return null;

    const handleAction = (userId: string, type: 'like' | 'superlike' | 'pass') => {
        if (type === 'like') onLike(userId);
        else if (type === 'superlike') onSuperlike(userId);
        else onPass(userId);

        setDirection(type === 'pass' ? -1 : 1);
        setCurrentIndex(prev => prev + 1);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[400px] w-[95%] p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-gradient-to-b from-background to-muted/20">
                <DialogHeader className="p-5 pb-2 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-lg font-black flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Respuestas
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {question}
                        </DialogDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="p-5 min-h-[200px] max-h-[450px] flex flex-col justify-between relative overflow-hidden">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary h-8 w-8" />
                        </div>
                    ) : answers.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Sparkles className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-bold text-foreground">Aún no hay respuestas</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                                Parece que eres de los primeros en responder hoy. Vuelve más tarde para ver qué dicen otras personas.
                            </p>
                        </div>
                    ) : currentIndex >= answers.length ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-full">
                                <Check className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-bold text-foreground">¡Eso es todo por hoy!</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                                Has visto todas las respuestas disponibles de hoy. ¡Vuelve mañana para más reflexiones!
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={cardVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="flex-1 flex flex-col justify-between h-full w-full"
                            >
                                <div className="flex-1 bg-card border rounded-3xl overflow-hidden shadow-md flex flex-col relative group">
                                    <div className="p-4 flex items-center gap-3 border-b bg-muted/10">
                                        <Link
                                            href={`/profile/${currentAnswer.profile.userId}`}
                                            className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 hover:opacity-90 transition-opacity"
                                            onClick={onClose}
                                        >
                                            <SafeImage
                                                src={currentAnswer.profile.photos?.[0] || '/placeholder.svg'}
                                                alt={currentAnswer.profile.displayName}
                                                fill
                                                sizes="48px"
                                                className="object-cover"
                                                loading="lazy"
                                            />
                                        </Link>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/profile/${currentAnswer.profile.userId}`}
                                                className="font-bold text-foreground hover:text-primary transition-colors hover:underline text-sm flex items-center gap-1.5"
                                                onClick={onClose}
                                            >
                                                {currentAnswer.profile.displayName}, {currentAnswer.profile.age}
                                                {currentAnswer.profile.isVerified && (
                                                    <Badge variant="secondary" className="px-1 py-0 h-4 bg-blue-500/10 text-blue-500 border-none font-bold text-[9px]">
                                                        ✓
                                                    </Badge>
                                                )}
                                            </Link>
                                            {currentAnswer.profile.city && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" /> {currentAnswer.profile.city}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-b from-transparent to-primary/5">
                                        <div className="text-primary/40 text-4xl font-serif leading-none -mt-4 mb-2 select-none">&ldquo;</div>
                                        <p className="text-sm font-medium text-foreground leading-relaxed italic px-2">
                                            {currentAnswer.answer}
                                        </p>
                                        <div className="text-primary/40 text-4xl font-serif leading-none mt-2 text-right select-none">&rdquo;</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-4 pt-4 shrink-0">
                                    <button
                                        onClick={() => handleAction(currentAnswer.profile.userId, 'pass')}
                                        className="bg-card hover:bg-muted text-destructive rounded-full w-12 h-12 flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 border border-border"
                                        aria-label="Pasar"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleAction(currentAnswer.profile.userId, 'superlike')}
                                        className="bg-accent hover:bg-accent/90 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 border border-accent/20"
                                        aria-label="Flechado"
                                    >
                                        <HeartArrow className="h-6 w-6" />
                                    </button>
                                    <button
                                        onClick={() => handleAction(currentAnswer.profile.userId, 'like')}
                                        className="bg-primary hover:bg-primary/95 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95"
                                        aria-label="Like"
                                    >
                                        <Heart className="h-5 w-5 fill-current" />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
