'use client';

import dynamic from 'next/dynamic';

const QADashboard = dynamic(() => import("@/components/qa/QADashboard"), { ssr: false });

export default function QAPage() {
    return <QADashboard />;
}
