/**
 * @deprecated Moved to deprecated route tree in V3.4.
 */
import { redirect } from 'next/navigation';

export default function SafetyCenterPage() {
    redirect('/settings/safety');
}

