export interface RegionalHealth {
    region: string;
    regionType: 'city' | 'state' | 'country';
    activeMen: number;
    activeWomen: number;
    activeVerifiedWomen: number;
    activeVerifiedMen: number;
    ratio: number;
    saturationLevel: 'excellent' | 'healthy' | 'warning' | 'critical';
    recommendation: string;
    totalUsers: number;
}

export interface MarketplaceSnapshot {
    global: RegionalHealth;
    regions: RegionalHealth[];
    alerts: MarketplaceAlert[];
    timestamp: Date;
}

export interface MarketplaceAlert {
    type: 'ratio_critical' | 'female_decline' | 'conversation_drop' | 'saturation';
    region: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
    detectedAt: Date;
}

export interface WaitlistEntry {
    id: string;
    userId: string;
    region: string;
    status: 'waiting' | 'approved' | 'expired';
    priority: number;
    createdAt: Date;
    processedAt: Date | null;
}

export interface SaturationConfig {
    excellentMax: number;  // ratio < this = excellent
    healthyMax: number;    // ratio < this = healthy
    warningMax: number;    // ratio < this = warning
    // ratio >= warningMax = critical
}

export const DEFAULT_SATURATION_CONFIG: SaturationConfig = {
    excellentMax: 1.2,
    healthyMax: 2.0,
    warningMax: 3.0,
};

export function getSaturationLevel(ratio: number, config: SaturationConfig = DEFAULT_SATURATION_CONFIG): RegionalHealth['saturationLevel'] {
    if (ratio < config.excellentMax) return 'excellent';
    if (ratio < config.healthyMax) return 'healthy';
    if (ratio < config.warningMax) return 'warning';
    return 'critical';
}

export function getSaturationRecommendation(level: RegionalHealth['saturationLevel'], ratio: number): string {
    switch (level) {
        case 'excellent':
            return 'Balance ideal — la comunidad está equilibrada';
        case 'healthy':
            return 'Balance saludable — hay buena diversidad de género';
        case 'warning':
            return `Desequilibrio moderado (ratio ${ratio.toFixed(1)}:1) — considerar promover invitaciones femeninas`;
        case 'critical':
            return `Desequilibrio crítico (ratio ${ratio.toFixed(1)}:1) — activar lista de espera masculina`;
    }
}
