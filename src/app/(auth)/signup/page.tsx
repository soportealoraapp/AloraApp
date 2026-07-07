import { cookies } from 'next/headers';
import { OnboardingWizardLazy } from "@/components/onboarding/OnboardingWizardLazy";
import { REFERRAL_COOKIE, REFERRAL_CODE_PATTERN } from '@/lib/referral/constants';

export const dynamic = 'force-dynamic';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const refCode = typeof params.ref === 'string' ? params.ref.trim() : '';

  if (refCode && REFERRAL_CODE_PATTERN.test(refCode)) {
    const cookieStore = await cookies();
    cookieStore.set(REFERRAL_COOKIE, refCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <OnboardingWizardLazy initialRef={refCode} />
    </div>
  );
}
