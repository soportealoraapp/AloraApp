"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const OnboardingWizard = dynamic(
  () => import("./OnboardingWizard").then((m) => m.OnboardingWizard),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    ),
  }
);

export function OnboardingWizardLazy({ initialRef }: { initialRef?: string }) {
  return <OnboardingWizard initialRef={initialRef} />;
}
