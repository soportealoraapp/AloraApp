export default function generateSitemap() {
    const baseUrl = 'https://alora.com';
    const regions = ['es', 'en', 'fr', 'de', 'pt-br', 'jp'];

    const urls = regions.map(lang => ({
        url: `${baseUrl}/${lang}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
    }));

    return urls;
}
