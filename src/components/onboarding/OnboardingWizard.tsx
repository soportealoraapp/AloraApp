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

    useEffect(() => {
        if (profile) {
            setFormData(profile);
            // logic to resume step could go here
        }
    }, [profile]);

    const saveProgress = async (newData: Partial<UserProfile>) => {
        if (!user) return;
        const updatedData = { ...formData, ...newData };
        setFormData(updatedData);

        try {
            try {
                await updateUserProfile(user.id || user.uid || '', {
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
        <div className="max-w-md mx-auto p-6 bg-white dark:bg-card rounded-3xl shadow-xl dark:shadow-pink-900/10 min-h-[600px] flex flex-col border border-pink-50 dark:border-pink-900/20 transition-colors duration-500">
            <div className="mb-8">
                <Progress value={(step / totalSteps) * 100} className="h-2 bg-pink-100 dark:bg-pink-900/30" />
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-pink-400 dark:text-pink-300 mt-2">Paso {step} de {totalSteps}</p>
            </div>

            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -30, opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 150 }}
                        className="h-full"
                    >
                        {step === 1 && <StepBasicInfo userId={userId} data={formData} onUpdate={saveProgress} onNext={nextStep} />}
                        {step === 2 && <StepInterests userId={userId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                        {step === 3 && <StepPhotos userId={userId} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                        {step === 4 && <StepVerification onComplete={() => router.push('/discover')} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
