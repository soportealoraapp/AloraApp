"use client";

import dynamic from "next/dynamic";

const OnboardingWizard = dynamic(
  () => import("./OnboardingWizard").then((m) => m.OnboardingWizard),
  { ssr: false }
);

export function OnboardingWizardLazy({ initialRef }: { initialRef?: string }) {
  return <OnboardingWizard initialRef={initialRef} />;
}
