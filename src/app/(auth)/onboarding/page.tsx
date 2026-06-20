"use client";

import dynamic from "next/dynamic";
const OnboardingWizard = dynamic(() => import("@/components/onboarding/OnboardingWizard").then(m => m.OnboardingWizard), { ssr: false });

export default function OnboardingPage() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <OnboardingWizard />
    </div>
  );
}
