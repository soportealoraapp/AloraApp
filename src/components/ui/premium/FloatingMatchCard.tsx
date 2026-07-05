'use client';

import { motion, PanInfo, useAnimation, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SoftCard } from '../custom/SoftCard';
import { UserProfile } from '@/lib/domain/types';
import { SafeImage } from '@/components/ui/safe-image';
import { TrustBadge } from './TrustBadge';
import { ProfileActions } from '../../match/ProfileActions';
import { Clock, MessageCircle, Heart, X, Music, Eye, Ban } from 'lucide-react';
import { HeartArrow } from '../custom/HeartArrow';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { hapticsLight, hapticsMedium, hapticsHeavy } from '@/lib/mobile';
import { playLikeSound, playFlechadoSound } from '@/lib/sounds';
import { EMOTIONAL_MOTION } from '@/lib/constants/motion-config';
import Link from 'next/link';

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
  /** Whether the current user already has a match with this profile */
  hasExistingMatch?: boolean;
  /** Whether the current user already sent a like/superlike to this profile */
  priorInteraction?: 'like' | 'superlike' | 'pass' | null;
}

export const FloatingMatchCard = React.memo(function FloatingMatchCard({ profile, onSwipe, onFlechado, compatibility, compatibilityDetails, superlikesRemaining, explanations, hasExistingMatch, priorInteraction }: FloatingMatchCardProps) {
  const controls = useAnimation();
  const [dragX, setDragX] = useState(0);
  const [likeBurst, setLikeBurst] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = profile.photos || [];
  const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [showLongPressMenu, setShowLongPressMenu] = useState(false);

  useEffect(() => {
    return () => {
      if (likeTimeoutRef.current) clearTimeout(likeTimeoutRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  // Long press handler — 500ms hold triggers context menu
  const handleLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    longPressTimerRef.current = setTimeout(() => {
      hapticsHeavy();
      setShowLongPressMenu(true);
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleFlechadoClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onFlechado) return;
    setLikeBurst(true);
    hapticsMedium();
    playFlechadoSound();
    likeTimeoutRef.current = setTimeout(() => {
      setLikeBurst(false);
      onFlechado();
    }, 500);
  }, [onFlechado]);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLikeBurst(true);
    hapticsLight();
    playLikeSound();
    likeTimeoutRef.current = setTimeout(() => {
      setLikeBurst(false);
      onSwipe('right');
    }, 400);
  }, [onSwipe]);

  const handleDrag = (event: any, info: PanInfo) => {
    setDragX(info.offset.x);
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    setDragX(0);
    const velocity = Math.abs(info.velocity.x);
    const threshold = velocity > 500 ? 30 : 100;
    if (info.offset.x > threshold) {
      hapticsLight();
      await controls.start(EMOTIONAL_MOTION.swipeRight);
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      hapticsLight();
      await controls.start(EMOTIONAL_MOTION.swipeLeft);
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
      drag={shouldReduceMotion ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      onDrag={shouldReduceMotion ? undefined : handleDrag}
      onDragEnd={shouldReduceMotion ? undefined : handleDragEnd}
      animate={controls}
      initial={shouldReduceMotion ? false : EMOTIONAL_MOTION.cardEntry.initial}
      whileInView={shouldReduceMotion ? undefined : EMOTIONAL_MOTION.cardEntry.animate}
      transition={shouldReduceMotion ? { duration: 0 } : EMOTIONAL_MOTION.cardEntry.transition}
      className="absolute w-full h-full max-w-sm cursor-grab active:cursor-grabbing flex flex-col"
      whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onTouchMove={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
      onMouseLeave={handleLongPressEnd}
    >
      <SoftCard className="flex-1 min-h-0 overflow-hidden relative border-none shadow-xl rounded-2xl bg-card">
        {photos.length > 0 ? (
          <div
            className="absolute inset-0 z-10"
            onClick={(e) => {
              // Tap-left/right to cycle photos
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const isLeftThird = x < rect.width / 3;
              const isRightThird = x > (rect.width * 2) / 3;
              if (isLeftThird && currentPhotoIndex > 0) {
                setCurrentPhotoIndex(prev => prev - 1);
              } else if (isRightThird && currentPhotoIndex < photos.length - 1) {
                setCurrentPhotoIndex(prev => prev + 1);
              }
            }}
          />
        ) : null}
        {photos.length > 0 ? (
          photos.map((photo, index) => (
            Math.abs(index - currentPhotoIndex) <= 1 && (
              <SafeImage
                key={index}
                src={photo}
                alt={`${profile.displayName} ${index + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, 400px"
                className={`object-cover pointer-events-none transition-opacity duration-300 ${
                  index === currentPhotoIndex ? 'opacity-100' : 'opacity-0'
                }`}
                priority={index === 0}
              />
            )
          ))
        ) : (
          <SafeImage
            src="/placeholder.svg"
            alt={profile.displayName}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover pointer-events-none"
            priority
          />
        )}

        {/* Photo dots indicator */}
        {photos.length > 1 && (
          <div className="absolute top-2 left-0 right-0 z-20 flex justify-center gap-1.5 px-4">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPhotoIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === currentPhotoIndex
                    ? 'bg-foreground/30 w-4'
                    : 'bg-foreground/20 w-1.5 hover:bg-foreground/40'
                }`}
                aria-label={`Foto ${index + 1}`}
                aria-current={index === currentPhotoIndex ? 'true' : undefined}
              />
            ))}
          </div>
        )}

        {/* Swipe indicators during drag */}
        {dragX > 50 && (
          <div className="absolute inset-0 z-30 bg-primary/20 flex items-center justify-start p-8">
            <div className="bg-card rounded-full p-4 shadow-xl">
              <Heart className="h-10 w-10 text-primary fill-primary" />
            </div>
          </div>
        )}
        {dragX < -50 && (
          <div className="absolute inset-0 z-30 bg-destructive/20 flex items-center justify-end p-8">
            <div className="bg-card rounded-full p-4 shadow-xl">
              <X className="h-10 w-10 text-destructive" />
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 z-20">
          <ProfileActions userId={profile.id} userName={profile.displayName} />
        </div>

        {/* Prior interaction/match indicator */}
        {hasExistingMatch && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-4 left-4 z-20 bg-green-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border border-green-400/30 shadow-sm"
          >
            <Heart className="h-3 w-3 fill-current" /> Match
          </motion.div>
        )}
        {!hasExistingMatch && priorInteraction === 'like' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-4 left-4 z-20 bg-primary/90 backdrop-blur-md text-primary-foreground px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border border-primary/30 shadow-sm"
          >
            <Heart className="h-3 w-3 fill-current" /> Ya le diste like
          </motion.div>
        )}
        {!hasExistingMatch && priorInteraction === 'superlike' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-4 left-4 z-20 bg-amber-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border border-amber-400/30 shadow-sm"
          >
            <HeartArrow className="h-3 w-3" /> Flechado enviado
          </motion.div>
        )}

        {/* Single priority badge - top left */}
        {(() => {
          // Only show the most important badge (max 1)
          if (profile.activeNow) {
            return (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-4 left-4 z-10 bg-primary/90 backdrop-blur-md text-primary-foreground px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border border-primary/30 shadow-sm"
              >
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/75 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
                Activa ahora
              </motion.div>
            );
          }
          if (profile.sharedInterests !== undefined && profile.sharedInterests > 0) {
            return (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-4 left-4 z-10 bg-accent/90 backdrop-blur-md text-accent-foreground px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border border-accent/30 shadow-sm"
              >
                <Heart className="h-3 w-3" fill="currentColor" /> {profile.sharedInterests} interés{profile.sharedInterests > 1 ? 'es' : ''} en común
              </motion.div>
            );
          }
          if (profile.latestAnswer) {
            return (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-4 left-4 z-10 bg-warning/90 backdrop-blur-md text-warning-foreground px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border border-warning/30 shadow-sm"
              >
                <MessageCircle className="h-3 w-3" /> Respuesta del día
              </motion.div>
            );
          }
          if (!profile.activeNow && profile.lastActiveHours !== null && profile.lastActiveHours !== undefined) {
            return (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-4 left-4 z-10 bg-muted/80 backdrop-blur-md text-muted-foreground px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 border border-border/30 shadow-sm"
              >
                <Clock className="h-3 w-3" /> {formatLastActive(profile.lastActiveHours)}
              </motion.div>
            );
          }
          return null;
        })()}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 text-white min-h-[180px] flex flex-col justify-end">
          {/* Shared interests as content chips - not percentage */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.isVerified && <TrustBadge type="verified" />}
            {(profile.completenessScore ?? 0) >= 90 && <TrustBadge type="complete" />}
          </div>

          {profile.latestAnswer && (
            <div className="mb-2 bg-white/10 backdrop-blur-sm rounded-xl p-2.5">
              <p className="text-xs text-white/60 uppercase tracking-wider mb-0.5">
                {profile.latestAnswer.category || 'Pregunta del día'}
              </p>
              <p className="text-white/90 text-xs leading-tight line-clamp-2">
                &ldquo;{profile.latestAnswer.answer}&rdquo;
              </p>
            </div>
          )}

          <h2 className="text-3xl font-bold tracking-tight mb-1">{profile.displayName}, {profile.age}</h2>
          <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">{profile.bio}</p>
        </div>
      </SoftCard>

      {/* Action buttons: Pass (left), Flechado (center), Like (right) */}
      <div className="flex items-center justify-center gap-4 pt-4 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); onSwipe('left'); }}
          className="bg-card hover:bg-accent text-destructive rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 border border-border focus-visible:ring-2 focus-visible:ring-primary/70"
          aria-label="Descartar perfil"
          title="Pasar (deslizar a la izquierda)"
        >
          <X className="h-7 w-7" />
        </button>
        {onFlechado && (
          <button
            onClick={handleFlechadoClick}
            className="bg-accent hover:bg-accent/80 text-accent-foreground rounded-full w-16 h-16 flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 border border-accent/30 focus-visible:ring-2 focus-visible:ring-primary/70 relative"
            aria-label="Flechado"
            title={`Flechado: destaca tu interés (${superlikesRemaining ?? 0} restantes hoy)`}
          >
            <HeartArrow className="h-7 w-7" />
            <AnimatePresence>
              {likeBurst && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <span className="text-4xl">💘</span>
                </motion.div>
              )}
            </AnimatePresence>
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm border border-background">
              {superlikesRemaining ?? 0}
            </span>
          </button>
        )}
        <button
          onClick={handleLike}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary/70 relative"
          aria-label="Dar like"
          title="Dar Like (deslizar a la derecha)"
        >
          <Heart className="h-7 w-7 fill-current" />
          <AnimatePresence>
            {likeBurst && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center text-primary pointer-events-none"
              >
                <Heart className="h-10 w-10 fill-current" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Long Press Context Menu */}
      <AnimatePresence>
        {showLongPressMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl"
            onClick={(e) => { e.stopPropagation(); setShowLongPressMenu(false); }}
          >
            <div className="bg-card rounded-2xl shadow-2xl border p-2 min-w-[180px] space-y-1" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-bold text-muted-foreground px-3 py-1">{profile.displayName}</p>
              <Link
                href={`/profile/${profile.id}?source=discover`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm"
                onClick={() => setShowLongPressMenu(false)}
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>Ver perfil</span>
              </Link>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm"
                onClick={(e) => { e.stopPropagation(); setShowLongPressMenu(false); onSwipe('right'); }}
              >
                <Heart className="h-4 w-4 text-primary" />
                <span>Dar Like</span>
              </button>
              {onFlechado && (
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm"
                  onClick={(e) => { e.stopPropagation(); setShowLongPressMenu(false); onFlechado(); }}
                >
                  <HeartArrow className="h-4 w-4 text-amber-500" />
                  <span>Flechado</span>
                </button>
              )}
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm"
                onClick={(e) => { e.stopPropagation(); setShowLongPressMenu(false); onSwipe('left'); }}
              >
                <X className="h-4 w-4 text-destructive" />
                <span>Pasar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
