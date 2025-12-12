// scripts/perf/measure.ts
import { chromium } from 'playwright';

(async () => {
    console.log('🚀 Starting Performance Analysis...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const targetUrl = 'http://localhost:3000'; // Assuming dev server or build start

    console.log(`Navigating to ${targetUrl}...`);
    const startTime = Date.now();
    await page.goto(targetUrl);

    // Warm up
    await page.reload();

    const metrics = await page.evaluate(() => {
        const paint = performance.getEntriesByName('first-contentful-paint')[0];
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        return {
            FCP: paint ? paint.startTime : 0,
            TTFB: nav ? nav.responseStart - nav.requestStart : 0,
            LCP: 0, // Simplified, requires PerformanceObserver
            DomLoad: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0
        };
    });

    console.log('📊 Performance Metrics:');
    console.log(`- TTFB: ${metrics.TTFB.toFixed(2)}ms`);
    console.log(`- FCP: ${metrics.FCP.toFixed(2)}ms`);
    console.log(`- DOM Load: ${metrics.DomLoad.toFixed(2)}ms`);

    await browser.close();
    console.log('✅ Analysis Complete');
})();
