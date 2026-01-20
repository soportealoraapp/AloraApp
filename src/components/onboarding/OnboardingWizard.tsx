'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/server/actions/user";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepInterests } from "./StepInterests";
import { StepPhotos } from "./StepPhotos";
import { StepVerification } from "./StepVerification";
import { UserProfile } from "@/lib/domain/types"; // using domain type

export function OnboardingWizard() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const totalSteps = 4;
    const [formData, setFormData] = useState<Partial<UserProfile>>({});

    const [isInitialized, setIsInitialized] = useState(false);
    useEffect(() => {
        if (profile && !isInitialized) {
            setFormData(profile);
            setIsInitialized(true);
        }
    }, [profile, isInitialized]);

    const saveProgress = async (newData: Partial<UserProfile>) => {
        if (!user) return;
        const updatedData = { ...formData, ...newData };
        setFormData(updatedData);

        try {
            try {
                await updateUserProfile(user.id, {
                    ...updatedData,
                    createdAt: undefined, // Don't wipe
                    isCompleted: step === totalSteps // simplified logic
                } as any);
            } catch (e) {
                console.error("Auto-save failed", e);
            }
        } catch (e) {
            console.error("Auto-save failed", e);
        }
    };

    const nextStep = () => {
        if (step === totalSteps) {
            router.push('/discover');
            return;
        }
        setStep(prev => Math.min(prev + 1, totalSteps));
    };
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
    const userId = user?.id;

    return (
        <div className="max-w-md w-full mx-auto p-4 md:p-6 bg-background rounded-3xl shadow-xl dark:shadow-pink-900/10 min-h-[550px] md:min-h-[600px] flex flex-col border border-border transition-colors duration-500 overflow-hidden">
            <div className="mb-6 md:mb-8">
                <Progress value={(step / totalSteps) * 100} className="h-2 bg-pink-100 dark:bg-pink-900/30" />
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-pink-400 dark:text-pink-300 mt-2">Paso {step} de {totalSteps}</p>
            </div>

            <div className="flex-1 relative flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ type: "spring", damping: 35, stiffness: 180 }}
                        className="flex-1 flex flex-col"
                    >
                        {step === 1 && <StepBasicInfo userId={userId} data={formData} onUpdate={saveProgress} onNext={nextStep} />}
                        {step === 2 && <StepInterests userId={userId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                        {step === 3 && <StepPhotos userId={userId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                        {step === 4 && (
                            <div className="flex-1 flex flex-col">
                                <StepVerification onComplete={() => router.push('/discover')} />
                                <div className="mt-auto pt-6 text-center">
                                    <Button
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-primary text-xs"
                                        onClick={() => router.push('/discover')}
                                    >
                                        Lo haré más tarde
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
