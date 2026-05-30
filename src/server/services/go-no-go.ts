import { prisma } from '@/lib/prisma';
import { getMarketplaceHealth } from './marketplace-health';
import { getFemaleRetentionMetrics } from './female-retention';
import { getActivationFunnel } from './activation-funnel';

export interface GoNoGoResult {
    verdict: 'GO' | 'NO-GO' | 'CONDITIONAL';
    score: number;
    criteria: { name: string; value: string; threshold: string; passed: boolean }[];
    summary: string;
    recommendations: string[];
}

/**
 * Generate Go/No-Go report for beta public launch.
 */
export async function generateGoNoGoReport(): Promise<GoNoGoResult> {
    const [health, retention, funnel] = await Promise.all([
        getMarketplaceHealth(),
        getFemaleRetentionMetrics(),
        getActivationFunnel(),
    ]);

    const criteria = [
        {
            name: 'Marketplace Balance',
            value: `${health.genderRatio}:1`,
            threshold: '< 3.0:1',
            passed: health.genderRatio < 3.0,
        },
        {
            name: 'Conversation Rate',
            value: `${health.conversationRate}%`,
            threshold: '> 30%',
            passed: health.conversationRate > 30,
        },
        {
            name: 'Reply Rate',
            value: `${health.responseRate}%`,
            threshold: '> 30%',
            passed: health.responseRate > 30,
        },
        {
            name: 'Ghosting Rate',
            value: `${health.ghostingRate}%`,
            threshold: '< 50%',
            passed: health.ghostingRate < 50,
        },
        {
            name: 'Female D7 Retention',
            value: `${retention.retentionD7}%`,
            threshold: '> 15%',
            passed: retention.retentionD7 > 15,
        },
        {
            name: 'Activation Rate',
            value: `${funnel.overallConversion}%`,
            threshold: '> 10%',
            passed: funnel.overallConversion > 10,
        },
    ];

    const passedCount = criteria.filter(c => c.passed).length;
    const score = Math.round((passedCount / criteria.length) * 100);

    let verdict: GoNoGoResult['verdict'];
    if (passedCount >= 5) verdict = 'GO';
    else if (passedCount >= 3) verdict = 'CONDITIONAL';
    else verdict = 'NO-GO';

    const recommendations: string[] = [];
    if (!criteria.find(c => c.name === 'Marketplace Balance')?.passed) {
        recommendations.push('Mejorar el balance de género antes del lanzamiento');
    }
    if (!criteria.find(c => c.name === 'Reply Rate')?.passed) {
        recommendations.push('Mejorar la calidad de los icebreakers y la compatibilidad');
    }
    if (!criteria.find(c => c.name === 'Female D7 Retention')?.passed) {
        recommendations.push('Fortalecer la experiencia femenina antes del lanzamiento');
    }

    const summary = verdict === 'GO'
        ? 'Alora está lista para beta pública. Los indicadores clave están dentro de los umbrales aceptables.'
        : verdict === 'CONDITIONAL'
        ? 'Alora puede lanzar con condiciones. Algunos indicadores necesitan mejora.'
        : 'Alora NO está lista para beta pública. Se requieren mejoras significativas.';

    return { verdict, score, criteria, summary, recommendations };
}
