'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function BackToHome() {
    const { user } = useAuth();
    return <Link href={user ? '/discover' : '/'} className="text-primary hover:underline">Volver al inicio</Link>;
}
