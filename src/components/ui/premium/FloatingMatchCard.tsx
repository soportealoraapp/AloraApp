'use client';

import { motion, PanInfo, useAnimation } from 'framer-motion';
import { SoftCard } from '../custom/SoftCard';
import { UserProfile } from '@/lib/domain/types';
import Image from 'next/image';
import { TrustBadge } from './TrustBadge';
import { ProfileActions } from '../../match/ProfileActions';
import { Clock, Zap, MessageCircle, Heart, X, Star, Music } from 'lucide-react';
import { useState } from 'react';

interface FloatingMatchCardProps {
    profile: UserProfile;
    onSwipe: (direction: 'left' | 'right') => void;
    onFlechado?: () => void;
    compatibility?: number | null;
    compatibilityDetails?: {
        sharedValues?: string[];
        sharedInterests?: string[];
        sharedMusic?: string[];
    };
    superlikesRemaining?: number;
    explanations?: string[];
}

export function FloatingMatchCard({ profile, onSwipe, onFlechado, compatibility, compatibilityDetails, superlikesRemaining, explanations }: FloatingMatchCardProps) {
    const controls = useAnimation();
    const [dragX, setDragX] = useState(0);

    const handleDrag = (event: any, info: PanInfo) => {
        setDragX(info.offset.x);
    };

    const handleDragEnd = async (event: any, info: PanInfo) => {
        setDragX(0);
        const threshold = 100;
        if (info.offset.x > threshold) {
            await controls.start({ x: 500, opacity: 0, rotate: 20 });
            onSwipe('right');
        } else if (info.offset.x < -threshold) {
            await controls.start({ x: -500, opacity: 0, rotate: -20 });
            onSwipe('left');
        } else {
            controls.start({ x: 0, opacity: 1, rotate: 0 });
        }
    };

    const formatLastActive = (hours: number | null | undefined): string | null => {
        if (hours === null || hours === undefined) return null;
        if (hours < 1) return 'Activa ahora';
        if (hours < 2) return 'Activa hace 1 hora';
        if (hours < 24) return `Activa hace ${hours} horas`;
        const days = Math.floor(hours / 24);
        return `Activa hace ${days} día${days > 1 ? 's' : ''}`;
    };

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            animate={controls}
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 35 }}
            className="absolute w-full h-full max-w-sm cursor-grab active:cursor-grabbing"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
        >
            <SoftCard className="h-[600px] overflow-hidden relative border-none shadow-xl rounded-[2.5rem] bg-card">
                <Image
                    src={profile.photos?.[0] || '/placeholder.svg'}
                    alt={profile.displayName}
                    fill
                    className="object-cover pointer-events-none"
                    priority
                />

                {/* Swipe indicators during drag */}
                {dragX > 50 && (
                    <div className="absolute inset-0 z-30 bg-green-500/20 flex items-center justify-start p-8">
                        <div className="bg-white rounded-full p-4 shadow-xl">
                            <Heart className="h-10 w-10 text-green-500 fill-green-500" />
                        </div>
                    </div>
                )}
                {dragX < -50 && (
                    <div className="absolute inset-0 z-30 bg-red-500/20 flex items-center justify-end p-8">
                        <div className="bg-white rounded-full p-4 shadow-xl">
                            <X className="h-10 w-10 text-red-500" />
                        </div>
                    </div>
                )}

                <div className="absolute top-4 right-4 z-20">
                    <ProfileActions userId={profile.id} userName={profile.displayName} />
                </div>

                {/* Flechado button */}
                {onFlechado && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onFlechado(); }}
                        className="absolute top-4 left-4 z-20 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 relative"
                        aria-label="Flechado (superlike)"
                        title={`Flechado: envío prioritario (${superlikesRemaining ?? 3}/día). Le llegará como superlike destacado.`}
                    >
                        <Star className="h-5 w-5 fill-white" />
                        <span className="absolute -top-1 -right-1 bg-white text-blue-600 text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center shadow-sm border border-blue-200" style={{ width: '18px', height: '18px' }}>
                            {superlikesRemaining ?? 3}
                        </span>
                    </button>
                )}

                {/* Retention signals */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2" style={{ marginTop: onFlechado ? '3.5rem' : '0' }}>
                    {profile.activeNow && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-green-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-300/30 shadow-lg"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-200" />
                            </span>
                            Activa ahora
                        </motion.div>
                    )}
                    {profile.highResponseRate && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-blue-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-blue-300/30 shadow-lg"
                        >
                            <MessageCircle className="h-3 w-3" /> Responde rápido
                        </motion.div>
                    )}
                    {profile.sharedInterests !== undefined && profile.sharedInterests > 0 && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-purple-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-purple-300/30 shadow-lg"
                        >
                            <Heart className="h-3 w-3" fill="white" /> {profile.sharedInterests} interés{profile.sharedInterests > 1 ? 'es' : ''} en común
                        </motion.div>
                    )}
                    {profile.voiceIntro && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-indigo-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-indigo-300/30 shadow-lg"
                        >
                            <Music className="h-3 w-3" /> Voz
                        </motion.div>
                    )}
                    {(profile as any).latestAnswer && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-amber-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-amber-300/30 shadow-lg"
                        >
                            <MessageCircle className="h-3 w-3" /> Respuesta del día
                        </motion.div>
                    )}
                    {(profile as any).spotify?.topArtists?.length > 0 && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-green-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-300/30 shadow-lg"
                        >
                            <Music className="h-3 w-3" /> {(profile as any).spotify.topArtists[0]?.name || 'Spotify'}
                        </motion.div>
                    )}
                    {!profile.activeNow && profile.lastActiveHours !== null && profile.lastActiveHours !== undefined && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gray-600/80 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 border border-white/10 shadow-lg"
                        >
                            <Clock className="h-3 w-3" /> {formatLastActive(profile.lastActiveHours)}
                        </motion.div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white min-h-[180px] flex flex-col justify-end">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {compatibility !== null && compatibility !== undefined && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-pink-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold w-fit flex items-center gap-1 border border-pink-300/30 shadow-lg"
                            >
                                <Zap className="h-3 w-3" /> {compatibility}% Compatible
                            </motion.div>
                        )}
                        {profile.isVerified && <TrustBadge type="verified" />}
                        {(profile.completenessScore ?? 0) >= 90 && <TrustBadge type="complete" />}
                    </div>

                    {(profile as any).latestAnswer && (
                        <div className="mb-2 bg-white/10 backdrop-blur-sm rounded-xl p-2.5">
                            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">
                                {(profile as any).latestAnswer.category || 'Pregunta del día'}
                            </p>
                            <p className="text-white/90 text-xs leading-tight line-clamp-2">
                                {(profile as any).latestAnswer.answer}
                            </p>
                        </div>
                    )}

                    {explanations && explanations.length > 0 && (
                        <div className="mb-3 space-y-0.5">
                            {explanations.slice(0, 2).map((exp, i) => (
                                <div key={i} className="text-white/80 text-[11px] leading-tight">
                                    • {exp}
                                </div>
                            ))}
                        </div>
                    )}

                    <h2 className="text-3xl font-bold tracking-tight mb-1">{profile.displayName}, {profile.age}</h2>
                    <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">{profile.bio}</p>
                </div>
            </SoftCard>

            <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-6 z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); onSwipe('left'); }}
                    className="bg-white hover:bg-gray-100 text-red-500 rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 border border-gray-200"
                    aria-label="Descartar perfil"
                    title="Pasar (deslizar a la izquierda)"
                >
                    <X className="h-7 w-7" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onSwipe('right'); }}
                    className="bg-white hover:bg-gray-100 text-green-500 rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 border border-gray-200"
                    aria-label="Dar like al perfil"
                    title="Like (deslizar a la derecha)"
                >
                    <Heart className="h-7 w-7" />
                </button>
            </div>
        </motion.div>
    );
}
