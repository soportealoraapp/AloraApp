'use client';

import { motion, PanInfo, useAnimation } from 'framer-motion';
import { SoftCard } from '../custom/SoftCard';
import { UserProfile } from '@/lib/domain/types';
import Image from 'next/image';

interface FloatingMatchCardProps {
    profile: UserProfile;
    onSwipe: (direction: 'left' | 'right') => void;
}

export function FloatingMatchCard({ profile, onSwipe }: FloatingMatchCardProps) {
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
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="absolute w-full h-full max-w-sm"
            whileTap={{ cursor: 'grabbing' }}
        >
            <SoftCard className="h-[600px] overflow-hidden relative border-none shadow-xl rounded-3xl">
                <Image
                    src={profile.photos[0]}
                    alt={profile.name}
                    fill
                    className="object-cover pointer-events-none"
                    priority
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white">
                    <h2 className="text-3xl font-bold">{profile.name}, {profile.age}</h2>
                    <p className="text-white/80 line-clamp-2">{profile.bio}</p>
                </div>
            </SoftCard>
        </motion.div>
    );
}
