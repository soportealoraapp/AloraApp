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
import { UserProfile } from "@/lib/domain/types";
import { Sparkles, Heart } from "lucide-react";

const STEP_LABELS = ['Tu esencia', 'Tus colores', 'Tu sonrisa', 'Tu seguridad'];
const STEP_WELCOME = [
    'Cuéntanos quién eres',
    '¿Qué te hace vibrar?',
    'Muéstranos tu mundo',
    'Protege tu espacio',
];

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
            await updateUserProfile(user.id, {
                ...updatedData,
                createdAt: undefined,
                isCompleted: step === totalSteps,
            } as any);
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
        <div className="max-w-md w-full mx-auto p-4 md:p-8 bg-background rounded-3xl shadow-xl min-h-[600px] flex flex-col border border-border/50">
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Heart className="h-4 w-4 text-pink-400" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-pink-400 font-bold">
                        {STEP_LABELS[step - 1]}
                    </span>
                </div>
                <Progress value={(step / totalSteps) * 100} className="h-1.5 bg-pink-100" />
                <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500/60">
                        {STEP_WELCOME[step - 1]}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {step} / {totalSteps}
                    </p>
                </div>
            </div>

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
