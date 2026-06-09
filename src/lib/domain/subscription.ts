/**
 * Alora
 * © 2026 Alora Team. All rights reserved.
 *
 * Soporte: soporte.alora.app@gmail.com
 *
 * Desarrollado por:
 * - Alejandro Pérez Vázquez (CEO y fundador)
 * - Caleb Zacarías García
 * - Juan Carlos Moreno López
 * - Erik Barrera Barrera
 */

export type PlanTier = 'free' | 'plus';

export interface Subscription {
    id: string;
    userId: string;
    plan: PlanTier;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'canceled';
    autoRenew: boolean;
}

export interface Payment {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    provider: 'lemonsqueezy';
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

export interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
}

export const PLANS: Record<PlanTier, Plan> = {
    free: {
        id: 'price_free',
        name: 'Gratis',
        price: 0,
        currency: 'MXN',
        interval: 'month',
        features: [
            '50 likes diarios',
            'Ver quién te gusta',
            'Filtros de búsqueda',
            'Chat ilimitado',
            'Compatibilidad básica',
            'Icebreakers y quizzes',
            'Seguridad y bloqueo',
            '1 boost cada 5 días de racha'
        ]
    },
    plus: {
        id: 'price_plus_monthly',
        name: 'Alora+',
        price: 99,
        currency: 'MXN',
        interval: 'month',
        features: [
            'Likes ilimitados sin límite diario',
            'Prioridad en Discover (+15 puntos)',
            'Boost de visibilidad cada 7 días de racha',
            'Rewind: deshacer 3 swipes al día',
            'Modo Viaje: explora otras ciudades',
            'Modo Incógnito: controla tu visibilidad',
            'Historial completo de visitantes',
            'Filtros avanzados de búsqueda',
            'Estadísticas detalladas del perfil',
            'Compatibilidad premium explicada'
        ]
    }
};
