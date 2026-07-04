import { redirect } from 'next/navigation';

export default function RejectedUsersRedirect() {
    redirect('/settings/privacy/blocked');
}
