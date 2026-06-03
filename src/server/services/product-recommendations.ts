import {
  getCompatibilityImpact,
  getVoiceIntroImpact,
  getVerificationImpact,
  getExtendedRetention,
} from './product-metrics';

export interface ProductRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  metric: string;
  impact: string;
}

export async function generateRecommendations(days = 30): Promise<ProductRecommendation[]> {
  const recommendations: ProductRecommendation[] = [];

  try {
    const [compatibility, voiceIntro, verification, retention] = await Promise.all([
      getCompatibilityImpact(days),
      getVoiceIntroImpact(days),
      getVerificationImpact(days),
      getExtendedRetention(days),
    ]);

    // Voice intro impact
    const voiceWith = voiceIntro[0];
    const voiceWithout = voiceIntro[1];
    if (voiceWith && voiceWithout && voiceWithout.matchRate > 0) {
      const voiceDiffPct = Math.round(((voiceWith.matchRate - voiceWithout.matchRate) / voiceWithout.matchRate) * 100);
      if (voiceDiffPct > 5) {
        recommendations.push({
          category: 'voice_intro',
          priority: voiceDiffPct > 20 ? 'high' : 'medium',
          message: `Los usuarios con voz obtienen ${voiceDiffPct}% más matches`,
          metric: `${voiceWith.matchRate}% vs ${voiceWithout.matchRate}%`,
          impact: `Incrementar adopción de voice intro (actual: ${voiceWith.count} usuarios)`,
        });
      }
    }

    // Quiz impact
    const quizWith = compatibility[0];
    const quizWithout = compatibility[1];
    if (quizWith && quizWithout && quizWithout.matchRate > 0) {
      const quizDiffPct = Math.round(((quizWith.matchRate - quizWithout.matchRate) / quizWithout.matchRate) * 100);
      if (quizDiffPct > 5) {
        recommendations.push({
          category: 'quiz',
          priority: quizDiffPct > 20 ? 'high' : 'medium',
          message: `Los usuarios con quiz completado obtienen ${quizDiffPct}% más matches`,
          metric: `${quizWith.matchRate}% vs ${quizWithout.matchRate}%`,
          impact: `Incentivar finalización de quizzes (actual: ${quizWith.count} usuarios)`,
        });
      }
    }

    // Verification impact
    const verWith = verification[0];
    const verWithout = verification[1];
    if (verWith && verWithout && verWithout.matchRate > 0) {
      const verDiffPct = Math.round(((verWith.matchRate - verWithout.matchRate) / verWithout.matchRate) * 100);
      if (verDiffPct > 5) {
        recommendations.push({
          category: 'verification',
          priority: verDiffPct > 30 ? 'high' : 'medium',
          message: `Los usuarios verificados obtienen ${verDiffPct}% más matches`,
          metric: `${verWith.matchRate}% vs ${verWithout.matchRate}%`,
          impact: 'Mejorar visibilidad del CTA de verificación en onboarding y perfil',
        });
      }
    }

    // Voice D7 retention impact
    if (voiceWith && voiceWithout && voiceWithout.d7Retention > 0) {
      const retDiffPct = Math.round(((voiceWith.d7Retention - voiceWithout.d7Retention) / voiceWithout.d7Retention) * 100);
      if (Math.abs(retDiffPct) > 5) {
        recommendations.push({
          category: 'retention_voice',
          priority: retDiffPct > 0 ? 'medium' : 'low',
          message: retDiffPct > 0
            ? `Los usuarios con voz retienen ${retDiffPct}% más en D7`
            : `Los usuarios sin voz retienen ${Math.abs(retDiffPct)}% más en D7`,
          metric: `${voiceWith.d7Retention}% vs ${voiceWithout.d7Retention}%`,
          impact: retDiffPct > 0
            ? 'Fomentar grabación de voz durante onboarding'
            : 'Investigar por qué usuarios con voz tienen menor retención',
        });
      }
    }

    // Latest retention trend
    if (retention.length >= 2) {
      const latest = retention[retention.length - 1];
      const previous = retention[retention.length - 2];
      if (latest && previous) {
        const d1Trend = latest.d1.rate - previous.d1.rate;
        const d7Trend = latest.d7.rate - previous.d7.rate;
        if (d1Trend < -5) {
          recommendations.push({
            category: 'retention_d1',
            priority: 'high',
            message: `Retención D1 cayó ${Math.abs(d1Trend)} puntos vs el día anterior`,
            metric: `${latest.d1.rate}% (prev: ${previous.d1.rate}%)`,
            impact: 'Revisar cambios recientes en onboarding o primeras experiencias',
          });
        }
        if (d7Trend < -5) {
          recommendations.push({
            category: 'retention_d7',
            priority: 'high',
            message: `Retención D7 cayó ${Math.abs(d7Trend)} puntos`,
            metric: `${latest.d7.rate}% (prev: ${previous.d7.rate}%)`,
            impact: 'Evaluar calidad de matches y experiencia de conversación',
          });
        }
      }
    }
  } catch (error) {
    console.error('Error generating product recommendations:', error);
  }

  return recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}
