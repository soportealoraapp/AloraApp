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

    const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-3xl shadow-xl min-h-[600px] flex flex-col">
            <div className="mb-8">
                <Progress value={(step / totalSteps) * 100} className="h-2 bg-pink-100" />
                <p className="text-center text-sm text-muted-foreground mt-2">Paso {step} de {totalSteps}</p>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                    >
                        {step === 1 && <StepBasicInfo data={formData} onUpdate={saveProgress} onNext={nextStep} />}
                        {step === 2 && <StepInterests data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                        {step === 3 && <StepPhotos userId={user?.id || user?.uid} data={formData} onUpdate={saveProgress} onNext={nextStep} onPrev={prevStep} />}
                        {step === 4 && <StepVerification onComplete={() => router.push('/discover')} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
