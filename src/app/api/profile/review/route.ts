import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface ReviewItem {
    key: string;
    label: string;
    done: boolean;
    weight: number;
    action?: string;
    points?: number;
}

interface ReviewResult {
    score: number;
    maxScore: number;
    percentage: number;
    strengths: string[];
    opportunities: ReviewItem[];
    actions: Array<{ label: string; points: number; href: string }>;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const quizCount = await prisma.quizResult.count({
            where: { userId: user.id },
        });

        const reviewItems: ReviewItem[] = [
            {
                key: 'photos',
                label: 'Fotos de calidad',
                done: (profile.photos?.length || 0) >= 4,
                weight: 20,
                action: (profile.photos?.length || 0) < 4 ? 'Sube al menos 4 fotos' : undefined,
                points: 20,
            },
            {
                key: 'photoVariety',
                label: 'Variedad de fotos',
                done: (profile.photos?.length || 0) >= 3,
                weight: 5,
                action: (profile.photos?.length || 0) < 3 ? 'Añade más fotos' : undefined,
                points: 5,
            },
            {
                key: 'bio',
                label: 'Bio personal',
                done: (profile.bio?.length || 0) >= 100,
                weight: 15,
                action: (profile.bio?.length || 0) < 100 ? 'Escribe una bio de al menos 100 caracteres' : undefined,
                points: 15,
            },
            {
                key: 'bioAuthentic',
                label: 'Bio auténtica',
                done: (profile.bio?.length || 0) >= 50,
                weight: 5,
                action: (profile.bio?.length || 0) < 50 ? 'Cuenta algo real sobre ti' : undefined,
                points: 5,
            },
            {
                key: 'interests',
                label: 'Intereses variados',
                done: (profile.interests?.length || 0) >= 5,
                weight: 10,
                action: (profile.interests?.length || 0) < 5 ? 'Agrega al menos 5 intereses' : undefined,
                points: 10,
            },
            {
                key: 'values',
                label: 'Valores definidos',
                done: (profile.values?.length || 0) >= 3,
                weight: 10,
                action: (profile.values?.length || 0) < 3 ? 'Define tus valores principales' : undefined,
                points: 10,
            },
            {
                key: 'music',
                label: 'Gustos musicales',
                done: (profile.musicGenres?.length || 0) >= 3,
                weight: 5,
                action: (profile.musicGenres?.length || 0) < 3 ? 'Agrega tus géneros favoritos' : undefined,
                points: 5,
            },
            {
                key: 'voice',
                label: 'Presentación de voz',
                done: !!profile.voiceIntro,
                weight: 5,
                action: !profile.voiceIntro ? 'Graba una presentación de voz' : undefined,
                points: 5,
            },
            {
                key: 'quiz',
                label: 'Quiz completado',
                done: quizCount >= 1,
                weight: 10,
                action: quizCount < 1 ? 'Completa tu primer quiz de personalidad' : undefined,
                points: 10,
            },
            {
                key: 'verification',
                label: 'Identidad verificada',
                done: profile.isVerified,
                weight: 15,
                action: !profile.isVerified ? 'Verifica tu identidad' : undefined,
                points: 15,
            },
        ];

        const totalWeight = reviewItems.reduce((sum, item) => sum + item.weight, 0);
        const earnedScore = reviewItems.reduce((sum, item) => {
            return sum + (item.done ? item.weight : 0);
        }, 0);

        const percentage = Math.round((earnedScore / totalWeight) * 100);

        const strengths: string[] = [];
        reviewItems.forEach(item => {
            if (item.done) {
                strengths.push(item.label);
            }
        });

        const opportunities = reviewItems.filter(item => !item.done);

        const actions = opportunities
            .filter(item => item.points && item.action)
            .map(item => ({
                label: item.action!,
                points: item.points!,
                href: getActionHref(item.key),
            }))
            .sort((a, b) => b.points - a.points);

        let grade: ReviewResult['grade'] = 'F';
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 75) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 40) grade = 'D';

        const result: ReviewResult = {
            score: earnedScore,
            maxScore: totalWeight,
            percentage,
            strengths,
            opportunities,
            actions,
            grade,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error generating profile review:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function getActionHref(key: string): string {
    const map: Record<string, string> = {
        photos: '/profile/edit?section=photos',
        photoVariety: '/profile/edit?section=photos',
        bio: '/profile/edit?section=bio',
        bioAuthentic: '/profile/edit?section=bio',
        interests: '/profile/edit?section=interests',
        values: '/profile/edit?section=values',
        music: '/profile/edit?section=music',
        voice: '/profile/edit?section=voice',
        quiz: '/onboarding?step=quiz',
        verification: '/settings/verification',
    };
    return map[key] || '/profile/edit';
}
