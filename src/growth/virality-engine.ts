export class ViralityEngine {

    static generateSmartShareLink(type: 'profile' | 'event', id: string, origin: string): string {
        // Generates a deep link with attribution parameters
        // Example: alora.com/share/p/123?ref=user_456&source=whatsapp
        const baseUrl = 'https://app.alora.com';
        const campaign = `viral_${type}_share`;

        return `${baseUrl}/share/${type[0]}/${id}?utm_campaign=${campaign}&referrer=${origin}`;
    }

    static async generateOGImage(title: string, subtitle: string): Promise<string> {
        // Returns URL to dynamically generated Open Graph image
        // In prod: calls Vercel OG Image Generation
        return `https://og.alora.com/api/gen?title=${encodeURIComponent(title)}&sub=${encodeURIComponent(subtitle)}`;
    }
}
