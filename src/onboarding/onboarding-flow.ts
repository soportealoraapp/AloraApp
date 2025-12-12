export type UserArchetype = 'Connector' | 'Chill' | 'Social' | 'Deep';

export interface OnboardingStep {
    id: string;
    title: string;
    completed: boolean;
}

export const WELCOME_STEPS: OnboardingStep[] = [
    { id: 'profile', title: 'Create your Profile', completed: false },
    { id: 'voice', title: 'Record a Voice Intro', completed: false },
    { id: 'quiz', title: 'Take the Chemistry Quiz', completed: false },
];

export function determineArchetype(quizScore: number): UserArchetype {
    if (quizScore > 80) return 'Deep';
    if (quizScore > 60) return 'Connector';
    if (quizScore > 40) return 'Social';
    return 'Chill';
}

export function generateWelcomeMessage(name: string, archetype: UserArchetype): string {
    const messages = {
        'Deep': `Welcome ${name}! As a Deep connector, we've prioritized matches with detailed bios.`,
        'Connector': `Hi ${name}! You're a natural Connector. Check out our upcoming events!`,
        'Social': `Hey ${name}! Ready to mingle? Your Social profile is boosted.`,
        'Chill': `Welcome ${name}. No pressure, just good vibes here.`
    };
    return messages[archetype];
}
