import { redirect } from 'next/navigation';

export default function SafetyCenterPage() {
    redirect('/settings/safety');
}
