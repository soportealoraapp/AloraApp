export const DAILY_QUESTION_CATEGORY_LABELS: Record<string, string> = {
    values: 'Valores',
    goals: 'Metas',
    communication: 'Comunicación',
    connection: 'Conexión',
    lifestyle: 'Estilo de vida',
    growth: 'Crecimiento',
    dating: 'Citas',
    personality: 'Personalidad',
};

export function dailyQuestionCategoryLabel(category: string | null | undefined): string {
    if (!category) return 'Respuesta del día';
    return DAILY_QUESTION_CATEGORY_LABELS[category] || 'Respuesta del día';
}
