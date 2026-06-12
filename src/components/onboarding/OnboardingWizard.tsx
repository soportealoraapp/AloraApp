'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/server/actions/user";
import { useRouter } from "next/navigation";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepInterests } from "./StepInterests";
import { StepCreateAccount } from "./StepCreateAccount";
import { StepPhotos } from "./StepPhotos";
import { UserProfile } from "@/lib/domain/types";
import { Heart, Cloud } from "lucide-react";
import { REFERRAL_COOKIE, REFERRAL_SESSION_KEY, REFERRAL_CODE_PATTERN } from "@/lib/referral/constants";
import { trackEvent } from "@/lib/tracking/client";

const STEP_LABELS_ALL = ['Tu cuenta', 'Tu esencia', 'Tus fotos', 'Tus colores'];
const STEP_LABELS_OAUTH = ['Tu esencia', 'Tus fotos', 'Tus colores'];
const STEP_WELCOME_ALL = [
    'Crea tu cuenta',
    'Datos e intención',
    'Sube tus fotos',
    'Intereses, valores y música',
];
const STEP_WELCOME_OAUTH = [
    'Datos e intención',
    'Sube tus fotos',
    'Intereses, valores y música',
];

export function OnboardingWizard({ initialRef }: { initialRef?: string } = {}) {
    const { user, profile, authLoading, profileLoading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
    const [signupUserId, setSignupUserId] = useState<string>();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedRef = useRef<string>('');
    const hasCompletedRef = useRef(false);

    // OAuth users (Google/Apple) already have a user from auth context at mount
    // Email signup users start without a user
    const isOAuthUser = Boolean(user);
    const totalSteps = isOAuthUser ? 3 : 4;
    const STEP_LABELS = isOAuthUser ? STEP_LABELS_OAUTH : STEP_LABELS_ALL;
    const STEP_WELCOME = isOAuthUser ? STEP_WELCOME_OAUTH : STEP_WELCOME_ALL;

    const effectiveUserId = user?.id || signupUserId;

    useEffect(() => {
        if (!initialRef || !REFERRAL_CODE_PATTERN.test(initialRef)) return;
        try {
            sessionStorage.setItem(REFERRAL_SESSION_KEY, initialRef);
            const oneMonth = 60 * 60 * 24 * 30;
            document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(initialRef)}; path=/; max-age=${oneMonth}; samesite=lax`;
        } catch {
            // sessionStorage may be unavailable; cookie is the source of truth.
        }
    }, [initialRef]);

    useEffect(() => {
        if (isInitialized || authLoading || profileLoading) return;

        if (!user) {
            setIsInitialized(true);
            return;
        }

        if (profile) {
            setFormData(profile);
            const hasBasicInfo = Boolean(profile.displayName?.trim()) && Boolean(profile.age);
            const hasPhotos = Boolean(profile.photos && profile.photos.length > 0);

            if (isOAuthUser) {
                // OAuth users: step 1=BasicInfo, 2=Photos, 3=Interests
                if (!hasBasicInfo) {
                    setStep(1);
                } else if (!hasPhotos) {
                    setStep(2);
                } else {
                    setStep(3);
                }
            } else {
                // Email users: step 1=CreateAccount, 2=BasicInfo, 3=Photos, 4=Interests
                if (!hasBasicInfo) {
                    setStep(2);
                } else if (!hasPhotos) {
                    setStep(3);
                } else {
                    setStep(4);
                }
            }
        }
        setIsInitialized(true);
    }, [user, profile, authLoading, profileLoading, isInitialized, isOAuthUser]);

    useEffect(() => {
        if (isInitialized && effectiveUserId) {
            trackEvent('onboarding_started', { userId: effectiveUserId, isOAuth: isOAuthUser });
        }
    }, [isInitialized, effectiveUserId, isOAuthUser]);

    const saveProgress = useCallback(async (newData: Partial<UserProfile>) => {
        if (!effectiveUserId || hasCompletedRef.current) return;
        const updatedData = { ...formData, ...newData };
        setFormData(updatedData);

        const serialized = JSON.stringify(updatedData);
        if (serialized === lastSavedRef.current) return;
        lastSavedRef.current = serialized;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        setSyncStatus('syncing');
        debounceRef.current = setTimeout(async () => {
            if (hasCompletedRef.current) return;
            try {
                await updateUserProfile(effectiveUserId, {
                    ...updatedData,
                    createdAt: undefined,
                    isCompleted: false,
                } as any);
                setSyncStatus('saved');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } catch {
                setSyncStatus('error');
                console.error("Auto-save failed");
            }
        }, 800);
    }, [effectiveUserId, formData]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleAccountCreated = useCallback((userId: string) => {
        setSignupUserId(userId);
        setStep(2);
    }, []);

    const completeOnboarding = useCallback(async () => {
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (effectiveUserId) {
            try {
                await updateUserProfile(effectiveUserId, {
                    ...formData,
                    isCompleted: true,
                } as any);
            } catch {
                console.error("Failed to mark profile as completed");
            }
        }
        trackEvent('onboarding_completed', { userId: effectiveUserId });
        router.push('/discover');
    }, [effectiveUserId, router, formData]);

    const nextStep = useCallback(async () => {
        if (step === totalSteps) {
            await completeOnboarding();
            return;
        }
        // Save immediately when changing step (not debounced)
        if (effectiveUserId) {
            const serialized = JSON.stringify(formData);
            if (serialized !== lastSavedRef.current) {
                lastSavedRef.current = serialized;
                setSyncStatus('syncing');
                updateUserProfile(effectiveUserId, {
                    ...formData,
                    isCompleted: false,
                } as any).then(() => {
                    setSyncStatus('saved');
                    setTimeout(() => setSyncStatus('idle'), 2000);
                }).catch(() => {
                    setSyncStatus('error');
                });
            }
        }
        setStep(prev => Math.min(prev + 1, totalSteps));
    }, [step, totalSteps, completeOnboarding, effectiveUserId, formData]);

    const prevStep = useCallback(() => setStep(prev => Math.max(prev - 1, 1)), []);

    return (
        <div className="w-full min-h-dvh md:min-h-0 md:max-w-md md:mx-auto p-4 md:p-8 bg-background md:rounded-3xl md:shadow-xl md:border md:border-border/50 flex flex-col">
            {step >= 1 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-primary" />
                            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">
                                {STEP_LABELS[step - 1]}
                            </span>
                        </div>
                        {syncStatus === 'syncing' && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Cloud className="h-3 w-3 animate-pulse" /> Guardando...
                            </span>
                        )}
                        {syncStatus === 'saved' && (
                            <span className="text-xs text-primary">Guardado</span>
                        )}
                        {syncStatus === 'error' && (
                            <span className="text-xs text-destructive">Error al guardar</span>
                        )}
                    </div>
                    <Progress value={((step - 1) / (totalSteps - 1)) * 100} className="h-1.5" />
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {STEP_WELCOME[step - 1]}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Paso {step} de {totalSteps}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex-1 relative flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="flex-1 flex flex-col"
                    >
                        {isOAuthUser ? (
                            <>
                                {step === 1 && <StepBasicInfo userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} />}
                                {step === 2 && <StepPhotos userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                                {step === 3 && <StepInterests userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                            </>
                        ) : (
                            <>
                                {step === 1 && (
                                    <StepCreateAccount onAccountCreated={handleAccountCreated} initialRef={initialRef} />
                                )}
                                {step === 2 && <StepBasicInfo userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} />}
                                {step === 3 && <StepPhotos userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                                {step === 4 && <StepInterests userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
