import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.text().includes('Filtered Properties')) {
            console.log('BROWSER LOG:', msg.text());
        }
    });

    await page.goto('http://localhost:5175/city/lahore', { waitUntil: 'networkidle' });
    await browser.close();
})();
