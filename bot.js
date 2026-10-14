const puppeteer = require('puppeteer');

async function runBot() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    
    console.log("Saytga kirilmoqda...");
    await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { waitUntil: 'networkidle2', timeout: 60000 });
    
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: '1_before.png', fullPage: true });
    console.log("1_before.png saqlandi.");

    console.log("Tugma bosilmoqda...");
    await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent.includes('Нафақа ёшига етмаган фуқаро'));
        if (el) el.click();
    });

    await new Promise(r => setTimeout(r, 6000));
    const pages = await browser.pages();
    const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

    await activePage.screenshot({ path: '2_middle.png', fullPage: true });
    await activePage.screenshot({ path: '3_after.png', fullPage: true });
    console.log("Barcha skrinshotlar saqlandi.");

    await browser.close();
}

runBot();
