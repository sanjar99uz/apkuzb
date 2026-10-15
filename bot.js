const puppeteer = require('puppeteer');

async function runBot() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    
    // Sahifaga kirish va 1-rasmni olish
    await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: '1_before.png', fullPage: true });

    // Tugmani bosish
    await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent.includes('Нафақа ёшига етмаган фуқаро'));
        if (el) el.click();
    });

    // Play Market ochilishini kutish va qolgan rasmlarni olish
    await new Promise(r => setTimeout(r, 6000));
    const pages = await browser.pages();
    const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

    await activePage.screenshot({ path: '2_middle.png', fullPage: true });
    await activePage.screenshot({ path: '3_after.png', fullPage: true });
    
    await browser.close();
    console.log("Bajarildi va rasmlar saqlandi.");
}

runBot();
