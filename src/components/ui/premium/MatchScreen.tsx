'use client';

import { motion } from 'framer-motion';
import { AvatarGlow } from '../custom/AvatarGlow';
import { PinkButton } from '../custom/PinkButton';
import { UserProfile } from '@/lib/domain/types';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { EMOTIONAL_MOTION } from '@/lib/constants/motion-config';
import { BRAND_VOICE } from '@/lib/constants/brand-voice';

interface MatchScreenProps {
    userProfile: UserProfile;
    matchedProfile: UserProfile;
    onChat: () => void;
    onKeepSwiping: () => void;
}

export function MatchScreen({ userProfile, matchedProfile, onChat, onKeepSwiping }: MatchScreenProps) {
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm text-white">
            <div className="absolute inset-0 overflow-hidden">
                <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={200} gravity={0.1} colors={['#F48FB1', '#ffffff']} />
            </div>

            <motion.div
                initial={EMOTIONAL_MOTION.matchReveal.initial}
                animate={EMOTIONAL_MOTION.matchReveal.animate}
                transition={EMOTIONAL_MOTION.matchReveal.transition as any}
                className="z-10 text-center mb-10"
            >
                <h1 className="text-6xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 drop-shadow-lg">
                    {BRAND_VOICE.nudges.newMatch}
                </h1>
                <p className="mt-2 text-xl text-white/80">Todo gran vínculo comienza con una conexión especial.</p>
            </motion.div>

            <div className="flex items-center justify-center gap-8 mb-12 relative z-10">
                <motion.div
                    initial={{ x: -150, opacity: 0, rotate: -15 }}
                    animate={{ x: 0, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, delay: 0.2 }}
                >
                    <AvatarGlow src={userProfile.photos[0]} size="xl" className="border-4 border-white rounded-full shadow-[0_0_50px_rgba(244,143,177,0.6)]" />
                </motion.div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="text-5xl"
                >
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        ❤️
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ x: 150, opacity: 0, rotate: 15 }}
                    animate={{ x: 0, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, delay: 0.2 }}
                >
                    <AvatarGlow src={matchedProfile.photos[0]} size="xl" className="border-4 border-white rounded-full shadow-[0_0_50px_rgba(168,85,247,0.6)]" />
                </motion.div>
            </div>

            <div className="flex flex-col gap-4 z-10 w-full max-w-xs">
                <PinkButton onClick={onChat} glow className="w-full text-lg py-6">
                    Enviar Mensaje
                </PinkButton>
                <button onClick={onKeepSwiping} className="text-white/70 hover:text-white transition-colors underline">
                    Seguir explorando
                </button>
            </div>
        </div>
    );
}
