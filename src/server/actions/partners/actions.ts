'use server';

export interface Partner {
    id: string;
    name: string;
    type: string;
    address: string;
    perks: string[];
}

export async function getPartners(): Promise<Partner[]> { return []; }
export async function registerPartner() { return { success: false }; }
export async function listPartners(): Promise<Partner[]> { return []; }
