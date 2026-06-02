import { calculateProfileCompleteness } from "@/server/services/profile-completeness";

export function calculateCompleteness(profile: any): number {
    return calculateProfileCompleteness(profile);
}
