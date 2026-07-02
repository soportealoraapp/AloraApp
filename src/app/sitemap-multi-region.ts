export default function generateSitemap() {
    const baseUrl = 'https://alora.app';

    const pages = [
        '',
        '/login',
        '/signup',
        '/terms',
        '/privacy',
        '/support',
        '/contact',
    ];

    return pages.map(path => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' ? 1 : 0.5,
    }));
}
