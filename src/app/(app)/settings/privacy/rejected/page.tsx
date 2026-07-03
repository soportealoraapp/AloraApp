'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RejectedUsersRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/settings/privacy/blocked');
    }, [router]);

    return null;
}
