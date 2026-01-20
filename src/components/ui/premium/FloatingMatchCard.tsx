'use client';

import { motion, PanInfo, useAnimation } from 'framer-motion';
import { SoftCard } from '../custom/SoftCard';
import { UserProfile } from '@/lib/domain/types';
import Image from 'next/image';
import { TrustBadge } from './TrustBadge';
import { ProfileActions } from '../../match/ProfileActions';

interface FloatingMatchCardProps {
    profile: UserProfile;
    onSwipe: (direction: 'left' | 'right') => void;
    compatibility?: number;
}

export function FloatingMatchCard({ profile, onSwipe, compatibility }: FloatingMatchCardProps) {
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
                    src={profile.photos?.[0] || '/placeholder.jpg'}
                    alt={profile.displayName}
                    fill
                    className="object-cover pointer-events-none"
                    priority
                />

                {/* Actions Overlay */}
                <div className="absolute top-4 right-4 z-20">
                    <ProfileActions userId={profile.id} userName={profile.displayName} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white min-h-[180px] flex flex-col justify-end">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {compatibility && compatibility >= 80 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-pink-500/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold w-fit flex items-center gap-1 border border-pink-300/30 shadow-lg"
                            >
                                <span className="animate-pulse">✨</span> {compatibility}% Compatible
                            </motion.div>
                        )}
                        {profile.isVerified && <TrustBadge type="verified" />}
                        {(profile.completenessScore ?? 0) >= 90 && <TrustBadge type="complete" />}
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight mb-1">{profile.displayName}, {profile.age}</h2>
                    <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">{profile.bio}</p>
                </div>
            </SoftCard>
        </motion.div>
    );
}
