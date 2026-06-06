'use client';

import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Shield, ShieldAlert, Clock } from 'lucide-react';

interface VerificationBadgeProps {
    status: 'verified' | 'pending' | 'rejected' | 'unverified';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function VerificationBadge({ status, size = 'sm', showLabel = true }: VerificationBadgeProps) {
    const config = {
        verified: {
            icon: ShieldCheck,
            label: 'Verificado',
            className: 'bg-blue-100 text-blue-700 border-blue-200',
            iconClass: 'text-blue-600',
        },
        pending: {
            icon: Clock,
            label: 'Pendiente',
            className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            iconClass: 'text-yellow-600',
        },
        rejected: {
            icon: ShieldAlert,
            label: 'Rechazado',
            className: 'bg-red-100 text-red-700 border-red-200',
            iconClass: 'text-red-600',
        },
        unverified: {
            icon: Shield,
            label: 'Sin verificar',
            className: 'bg-gray-100 text-gray-500 border-gray-200',
            iconClass: 'text-gray-400',
        },
    };

    const { icon: Icon, label, className, iconClass } = config[status];

    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5 gap-1',
        md: 'text-sm px-2 py-1 gap-1.5',
        lg: 'text-base px-3 py-1.5 gap-2',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <Badge variant="outline" className={`${className} ${sizeClasses[size]} font-medium`}>
            <Icon className={`${iconClass} ${iconSizes[size]}`} />
            {showLabel && <span>{label}</span>}
        </Badge>
    );
}
