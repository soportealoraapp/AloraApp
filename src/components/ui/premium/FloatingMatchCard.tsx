'use client';

import { motion, PanInfo, useAnimation } from 'framer-motion';
import { SoftCard } from '../custom/SoftCard';
import { UserProfile } from '@/lib/domain/types';
import Image from 'next/image';
import { TrustBadge } from './TrustBadge';
import { ProfileActions } from '../../match/ProfileActions';
import { Clock, Zap, MessageCircle, Heart } from 'lucide-react';

interface FloatingMatchCardProps {
    profile: UserProfile;
    onSwipe: (direction: 'left' | 'right') => void;
    compatibility?: number;
    compatibilityDetails?: {
        sharedValues?: string[];
        sharedInterests?: string[];
        sharedMusic?: string[];
    };
}

export function FloatingMatchCard({ profile, onSwipe, compatibility, compatibilityDetails }: FloatingMatchCardProps) {
    const controls = useAnimation();

    const handleDragEnd = async (event: any, info: PanInfo) => {
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

                <div className="absolute top-4 right-4 z-20">
                    <ProfileActions userId={profile.id} userName={profile.displayName} />
                </div>

                {/* Retention signals */}
                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
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
                        {compatibility !== undefined && compatibility >= 70 && (
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

                    {compatibility !== undefined && compatibility >= 50 && compatibilityDetails && (
                        <div className="mb-3 space-y-1">
                            {(() => {
                                const shared: string[] = [
                                    ...(compatibilityDetails.sharedValues || []),
                                    ...(compatibilityDetails.sharedInterests || []),
                                    ...(compatibilityDetails.sharedMusic || []),
                                ].slice(0, 3);
                                if (shared.length === 0) return null;
                                return (
                                    <div className="text-white/90 text-xs">
                                        <span className="font-semibold text-white/70">Comparten: </span>
                                        {shared.join(' · ')}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <h2 className="text-3xl font-bold tracking-tight mb-1">{profile.displayName}, {profile.age}</h2>
                    <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">{profile.bio}</p>
                </div>
            </SoftCard>
        </motion.div>
    );
}
