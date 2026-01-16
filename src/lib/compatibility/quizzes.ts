import { Quiz } from '../firebase/types';

export const COMPATIBILITY_QUIZZES: Quiz[] = [
    {
        id: 'values',
        title: 'Valores Personales',
        description: '¿Qué es lo más importante para ti en la vida y en una pareja?',
        icon: 'Heart',
        questions: [
            {
                id: 'loyalty',
                text: '¿Qué tan importante es la lealtad absoluta en una relación?',
                type: 'scale',
                category: 'values'
            },
            {
                id: 'ambition',
                text: '¿Prefieres una vida de éxito profesional o equilibrio personal?',
                type: 'choice',
                category: 'values',
                options: [
                    { label: 'Éxito Profesional', value: 'career' },
                    { label: 'Equilibrio Personal', value: 'balance' },
                    { label: 'Un poco de ambos', value: 'both' }
                ]
            },
            {
                id: 'family',
                text: '¿Qué importancia tiene la familia en tu día a día?',
                type: 'scale',
                category: 'values'
            },
            {
                id: 'honesty',
                text: '¿Crees que la honestidad brutal es siempre mejor que una "mentira piadosa"?',
                type: 'scale',
                category: 'values'
            },
            {
                id: 'growth',
                text: '¿Buscas a alguien que te impulse a crecer o alguien que te acepte como eres?',
                type: 'choice',
                category: 'values',
                options: [
                    { label: 'Que me impulse', value: 'growth' },
                    { label: 'Que me acepte tal cual', value: 'acceptance' }
                ]
            }
        ]
    },
    {
        id: 'communication',
        title: 'Comunicación Emocional',
        description: '¿Cómo expresas lo que sientes y cómo prefieres ser escuchado?',
        icon: 'MessageCircle',
        questions: [
            {
                id: 'openness',
                text: '¿Me gusta hablar de mis sentimientos apenas aparecen?',
                type: 'scale',
                category: 'communication'
            },
            {
                id: 'conflict_style',
                text: 'En un desacuerdo, ¿prefieres hablar en el momento o tomarte un tiempo?',
                type: 'choice',
                category: 'communication',
                options: [
                    { label: 'Hablar ya', value: 'immediate' },
                    { label: 'Tiempo para pensar', value: 'time' }
                ]
            },
            {
                id: 'listening',
                text: 'Cuando alguien me cuenta un problema, ¿tiendo a dar soluciones o solo escuchar?',
                type: 'choice',
                category: 'communication',
                options: [
                    { label: 'Dar soluciones', value: 'solutions' },
                    { label: 'Solo escuchar', value: 'listening' }
                ]
            },
            {
                id: 'affection',
                text: '¿Qué tan importante es el contacto físico para sentirte conectado/a?',
                type: 'scale',
                category: 'communication'
            },
            {
                id: 'validation',
                text: '¿Necesitas validación constante de tu pareja?',
                type: 'scale',
                category: 'communication'
            }
        ]
    },
    {
        id: 'lifestyle',
        title: 'Ritmo de Vida',
        description: 'Tus rutinas, hobbies y cómo usas tu energía diaria.',
        icon: 'Zap',
        questions: [
            {
                id: 'morning_person',
                text: '¿Eres más productivo/a en la mañana o en la noche?',
                type: 'choice',
                category: 'lifestyle',
                options: [
                    { label: 'Mañana ☀️', value: 'morning' },
                    { label: 'Noche 🌙', value: 'night' }
                ]
            },
            {
                id: 'social_energy',
                text: '¿Un fin de semana perfecto es una fiesta o una película en casa?',
                type: 'scale',
                category: 'lifestyle' // 1: Home, 5: Party
            },
            {
                id: 'travel_style',
                text: '¿Prefieres viajes planeados al detalle o improvisación total?',
                type: 'choice',
                category: 'lifestyle',
                options: [
                    { label: 'Planeado', value: 'planned' },
                    { label: 'Improvisado', value: 'spontaneous' }
                ]
            },
            {
                id: 'fitness',
                text: '¿La actividad física es parte esencial de tu semana?',
                type: 'scale',
                category: 'lifestyle'
            },
            {
                id: 'neatness',
                text: '¿Qué tan ordenado/a consideras que eres en tu hogar?',
                type: 'scale',
                category: 'lifestyle'
            }
        ]
    },
    {
        id: 'expectations',
        title: 'Expectativas de Relación',
        description: '¿Qué estás buscando realmente en este momento?',
        icon: 'Target',
        questions: [
            {
                id: 'commitment',
                text: '¿Buscas algo serio a largo plazo o algo más casual por ahora?',
                type: 'scale',
                category: 'expectations' // 1: Casual, 5: Serious
            },
            {
                id: 'independence',
                text: '¿Qué tan importante es mantener tu espacio e independencia total?',
                type: 'scale',
                category: 'expectations'
            },
            {
                id: 'future_plans',
                text: '¿Te ves viviendo en esta misma ciudad en los próximos 5 años?',
                type: 'choice',
                category: 'expectations',
                options: [
                    { label: 'Sí, definitivamente', value: 'yes' },
                    { label: 'No lo sé', value: 'maybe' },
                    { label: 'No, quiero mudarme', value: 'no' }
                ]
            },
            {
                id: 'monogamy',
                text: '¿Cuál es tu visión sobre la exclusividad?',
                type: 'choice',
                category: 'expectations',
                options: [
                    { label: 'Monogamia tradicional', value: 'monogamy' },
                    { label: 'Relación abierta', value: 'open' },
                    { label: 'No estoy seguro/a', value: 'uncertain' }
                ]
            }
        ]
    }
    // More quizzes can be added here following the same pattern
];
