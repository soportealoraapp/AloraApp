"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const OnboardingWizard = dynamic(() => import("@/components/onboarding/OnboardingWizard").then(m => m.OnboardingWizard), {
  ssr: false,
  loading: () => (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  ),
});

export default function OnboardingPage() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <OnboardingWizard />
    </div>
  );
}
