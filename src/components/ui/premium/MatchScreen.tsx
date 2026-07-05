'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AvatarGlow } from '../custom/AvatarGlow';
import { PinkButton } from '../custom/PinkButton';
import { UserProfile } from '@/lib/domain/types';
import { useEffect, useState } from 'react';
import { EMOTIONAL_MOTION } from '@/lib/constants/motion-config';
import { BRAND_VOICE } from '@/lib/constants/brand-voice';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageCircle, Send, Sparkles } from 'lucide-react';
import { playMatchSound } from '@/lib/sounds';
import { hapticsNotification } from '@/lib/mobile';

const SimpleConfetti = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [particles] = useState(() =>
        Array.from({ length: 40 }, (_, i) => ({
            shape: ['circle', 'square', 'triangle'][i % 3],
            color: ['#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#ff85a2', '#e879a8', '#f472b6'][i % 7],
            size: 6 + Math.floor(Math.random() * 15),
            left: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 2.5 + Math.random() * 2,
        }))
    );
    useEffect(() => {
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mql.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);
    if (prefersReducedMotion) return null;
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        left: `${p.left}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'square' ? '2px' : '0',
                        clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
                        animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s infinite`,
                        opacity: 0.9,
                    }}
                />
            ))}
        </div>
    );
};

interface MatchScreenProps {
    userProfile: UserProfile;
    matchedProfile: UserProfile;
    onChat: () => void;
    onKeepSwiping: () => void;
    matchId?: string;
}

export function MatchScreen({ userProfile, matchedProfile, onChat, onKeepSwiping, matchId }: MatchScreenProps) {
    const [icebreakers, setIcebreakers] = useState<string[]>([]);
    const [loadingIcebreakers, setLoadingIcebreakers] = useState(false);
    const [sending, setSending] = useState<string | null>(null);
    const [compatScore, setCompatScore] = useState<number | null>(null);
    const [compatExplanations, setCompatExplanations] = useState<string[]>([]);
    const { toast } = useToast();
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        playMatchSound();
        hapticsNotification('success');
    }, []);

    useEffect(() => {
        if (!matchedProfile?.id) return;
        if (userProfile.subscriptionStatus !== 'plus') return;
        fetch(`/api/compatibility/score?targetId=${matchedProfile.id}`)
            .then(r => r.json())
            .then(data => {
                if (data.score) {
                    setCompatScore(data.score);
                    setCompatExplanations(data.explanations || []);
                }
            })
            .catch(() => {});
    }, [matchedProfile?.id, userProfile.subscriptionStatus]);

    useEffect(() => {
        if (!matchId) return;
        setLoadingIcebreakers(true);
        fetch('/api/match/activation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId }),
        })
            .then(r => r.json())
            .then(data => {
                const starters = [
                    ...(data.icebreakers || []),
                    ...(data.questions || []),
                ].filter(Boolean).slice(0, 3);
                setIcebreakers(starters);
            })
            .catch(() => {})
            .finally(() => setLoadingIcebreakers(false));
    }, [matchId]);

    const handleSendStarter = async (starter: string) => {
        if (!matchId || sending) return;
        setSending(starter);
        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, text: starter, type: 'icebreaker' }),
            });
            if (res.ok) {
                toast({ title: 'Mensaje enviado ✨' });
                onChat();
            } else {
                throw new Error();
            }
        } catch (error) {
            toast({ title: 'Error al enviar', variant: 'destructive' });
        } finally {
            setSending(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 sm:backdrop-blur-sm text-white overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo match"
        >
            <div className="absolute inset-0 overflow-hidden">
                <SimpleConfetti />
            </div>

            <motion.div
                initial={shouldReduceMotion ? false : EMOTIONAL_MOTION.matchReveal.initial}
                animate={shouldReduceMotion ? { opacity: 1 } : EMOTIONAL_MOTION.matchReveal.animate}
                transition={shouldReduceMotion ? { duration: 0 } : EMOTIONAL_MOTION.matchReveal.transition as any}
                className="z-10 text-center mb-6"
            >
                <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent drop-shadow-lg">
                    {BRAND_VOICE.nudges.newMatch}
                </h1>
                <p className="mt-2 text-base md:text-xl text-white/80">Todo gran vínculo comienza con una conexión especial.</p>
            </motion.div>

            {compatScore !== null && (
                <motion.div
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.6 }}
                    className="z-10 mb-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 max-w-sm w-full mx-4"
                >
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white/90">{compatScore}% Compatibles</span>
                        <Sparkles className="h-4 w-4 text-pink-300" />
                    </div>
                    {compatExplanations.length > 0 && (
                        <div className="space-y-0.5">
                            {compatExplanations.slice(0, 2).map((exp, i) => (
                                <p key={i} className="text-[11px] text-white/70 leading-tight">• {exp}</p>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            <div className="flex items-center justify-center gap-4 md:gap-8 mb-6 relative z-10">
                <motion.div
                    initial={shouldReduceMotion ? false : { x: -150, opacity: 0, rotate: -15 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1, rotate: 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", damping: 15, delay: 0.2 }}
                >
                    <AvatarGlow src={userProfile.photos[0]} size="xl" className="border-4 border-white rounded-full shadow-[0_0_50px_hsl(var(--primary)/0.6)]" />
                </motion.div>

                    <motion.div
                        initial={shouldReduceMotion ? false : { scale: 0 }}
                        animate={shouldReduceMotion ? { scale: 1 } : { scale: [0, 1.2, 1] }}
                        transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.8, type: "spring" }}
                        className="text-4xl md:text-5xl"
                    >
                        <motion.div
                            animate={shouldReduceMotion ? {} : { scale: [1, 1.2, 1] }}
                            transition={shouldReduceMotion ? {} : { repeat: 4, duration: 1.5 }}
                        >
                            ❤️
                        </motion.div>
                    </motion.div>

                <motion.div
                    initial={shouldReduceMotion ? false : { x: 150, opacity: 0, rotate: 15 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1, rotate: 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", damping: 15, delay: 0.2 }}
                >
                    <AvatarGlow src={matchedProfile.photos[0]} size="xl" className="border-4 border-white rounded-full shadow-[0_0_50px_hsl(var(--accent)/0.6)]" />
                </motion.div>
            </div>

            {matchId && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="z-10 w-full max-w-md px-4 mb-6"
                >
                    <div className="flex items-center gap-2 mb-3 justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-bold">Ideas para iniciar conversación</p>
                    </div>

                    {loadingIcebreakers ? (
                        <div className="flex items-center justify-center py-6 text-white/70">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-xs">Generando ideas...</span>
                        </div>
                    ) : icebreakers.length > 0 ? (
                        <div className="space-y-2">
                            {icebreakers.map((starter, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.3 + i * 0.1 }}
                                    onClick={() => handleSendStarter(starter)}
                                    disabled={sending !== null}
                                    className="w-full text-left bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-3 transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm leading-snug flex-1">{starter}</p>
                                        {sending === starter ? (
                                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                        ) : (
                                            <Send className="h-4 w-4 text-primary shrink-0" />
                                        )}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    ) : null}
                </motion.div>
            )}

            <div className="flex flex-col gap-3 z-10 w-full max-w-xs px-4 pb-6">
                <PinkButton onClick={onChat} glow className="w-full text-lg py-6">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Enviar Mensaje
                </PinkButton>
                <button onClick={onKeepSwiping} className="text-white/90 hover:text-white transition-all underline text-sm bg-white/10 px-5 py-3 min-h-[44px] rounded-full">
                    Seguir explorando
                </button>
            </div>
        </div>
    );
}
