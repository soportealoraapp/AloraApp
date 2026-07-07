'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function AdminBackButton() {
    return (
        <Button variant="ghost" size="icon" asChild className="text-muted-foreground" aria-label="Volver">
            <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
            </Link>
        </Button>
    );
}
