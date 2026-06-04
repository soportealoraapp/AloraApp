'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/server/actions/user";
import { useRouter } from "next/navigation";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepInterests } from "./StepInterests";
import { StepPhotos } from "./StepPhotos";
import { StepVerification } from "./StepVerification";
import { StepCreateAccount } from "./StepCreateAccount";
import { UserProfile } from "@/lib/domain/types";
import { Heart, Cloud } from "lucide-react";
import { REFERRAL_COOKIE, REFERRAL_SESSION_KEY, REFERRAL_CODE_PATTERN } from "@/lib/referral/constants";
import { trackEvent } from "@/lib/tracking/client";

const STEP_LABELS = ['Tu cuenta', 'Tu esencia', 'Tus colores', 'Tu sonrisa', 'Tu seguridad'];
const STEP_WELCOME = [
    'Crea tu cuenta',
    'Cuéntanos quién eres',
    '¿Qué te hace vibrar?',
    'Muéstranos tu mundo',
    'Protege tu espacio',
];

export function OnboardingWizard({ initialRef }: { initialRef?: string } = {}) {
    const { user, profile, authLoading, profileLoading } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const totalSteps = 5;
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
    const [signupUserId, setSignupUserId] = useState<string>();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSavedRef = useRef<string>('');
    const hasCompletedRef = useRef(false);

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
        if (!authLoading && user) {
            setStep(2);
        }
    }, [authLoading, profileLoading, user]);

    useEffect(() => {
        if (profile && !isInitialized) {
            setFormData(profile);
            setIsInitialized(true);
        }
    }, [profile, isInitialized]);

    const saveProgress = useCallback(async (newData: Partial<UserProfile>) => {
        if (!effectiveUserId) return;
        const updatedData = { ...formData, ...newData };
        setFormData(updatedData);

        const serialized = JSON.stringify(updatedData);
        if (serialized === lastSavedRef.current) return;
        lastSavedRef.current = serialized;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        setSyncStatus('syncing');
        debounceRef.current = setTimeout(async () => {
            try {
                await updateUserProfile(effectiveUserId, {
                    ...updatedData,
                    createdAt: undefined,
                    isCompleted: step === totalSteps,
                } as any);
                setSyncStatus('saved');
                setTimeout(() => setSyncStatus('idle'), 2000);
            } catch {
                setSyncStatus('error');
                console.error("Auto-save failed");
            }
        }, 800);
    }, [effectiveUserId, formData, step]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleAccountCreated = useCallback((userId: string) => {
        setSignupUserId(userId);
        setStep(2);
    }, []);

    const completeOnboarding = useCallback(() => {
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        trackEvent('onboarding_completed', { userId: effectiveUserId });
        router.push('/discover');
    }, [effectiveUserId, router]);

    const nextStep = useCallback(() => {
        if (step === totalSteps) {
            completeOnboarding();
            return;
        }
        setStep(prev => Math.min(prev + 1, totalSteps));
    }, [step, totalSteps, completeOnboarding]);

    const prevStep = useCallback(() => setStep(prev => Math.max(prev - 1, 1)), []);

    return (
        <div className="w-full min-h-dvh md:min-h-0 md:max-w-md md:mx-auto p-4 md:p-8 bg-background md:rounded-3xl md:shadow-xl md:border md:border-border/50 flex flex-col">
            {step > 1 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-primary" />
                            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                                {STEP_LABELS[step - 1]}
                            </span>
                        </div>
                        {syncStatus === 'syncing' && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Cloud className="h-3 w-3 animate-pulse" /> Guardando...
                            </span>
                        )}
                        {syncStatus === 'saved' && (
                            <span className="text-[10px] text-green-500">Guardado</span>
                        )}
                        {syncStatus === 'error' && (
                            <span className="text-[10px] text-destructive">Error al guardar</span>
                        )}
                    </div>
                    <Progress value={((step - 1) / (totalSteps - 1)) * 100} className="h-1.5" />
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {STEP_WELCOME[step - 1]}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {step - 1} / {totalSteps - 1}
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
                        {step === 1 && (
                            <StepCreateAccount onAccountCreated={handleAccountCreated} initialRef={initialRef} />
                        )}
                        {step === 2 && <StepBasicInfo userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} />}
                        {step === 3 && <StepInterests userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                        {step === 4 && <StepPhotos userId={effectiveUserId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                        {step === 5 && (
                            <div className="flex-1 flex flex-col">
                                <StepVerification onComplete={completeOnboarding} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
