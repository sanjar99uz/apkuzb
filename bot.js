const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot Linux Desktop rejimida ishga tushdi...");

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        console.log("Asosiy ssilkaga kirilmoqda...");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });

        await new Promise(r => setTimeout(r, 3000));

        // 1. BEFORE: Boshlang'ich tugmali sahifani saqlash
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png saqlandi.");

        console.log("Tugma bosilmoqda...");
        const clicked = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('div, button, span, a, p'));
            const target = elements.find(el => el.textContent && el.textContent.trim().includes('Нафақа ёшига етмаган фуқаро'));
            if (target) {
                target.click();
                return true;
            }
            return false;
        });

        if (clicked) {
            await new Promise(r => setTimeout(r, 7000));
        }

        const pages = await browser.pages();
        const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

        await activePage.screenshot({ path: '2_middle.png', fullPage: true });
        await activePage.screenshot({ path: '3_after.png', fullPage: true });
        console.log("Barcha skrinshotlar saqlandi.");

    } catch (error) {
        console.error("Xatolik:", error);
    } finally {
        await browser.close();
        console.log("Tugallandi.");
    }
}

runBot();
