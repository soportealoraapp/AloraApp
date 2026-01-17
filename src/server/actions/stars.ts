'use server';

export async function getStars(userId: string) { return { total: 0, history: [] }; }
export async function sendStar() { return { success: false }; }
