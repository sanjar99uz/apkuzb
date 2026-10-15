const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot ishga tushdi...");

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=390,844',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();

        // Mobil qurilma sozlamalari
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');

        // Sayt avtomatik ravishda boshqa joyga sakrab ketishining oldini olish uchun meta refresh'larni bloklash
        await page.evaluateOnNewDocument(() => {
            const observer = new MutationObserver(() => {
                document.querySelectorAll('meta[http-equiv="refresh"]').forEach(m => m.remove());
            });
            observer.observe(document, { childList: true, subtree: true });
        });

        console.log("Ssilkaga kirilmoqda...");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });

        // 1. BEFORE: Darhol birinchi sahifani (tugmali sahifani) saqlab qolish
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png (tugmali sahifa) muvaffaqiyatli saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda va bosilmoqda...');

        // Tugmani topib darhol bosish
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
            console.log("Tugma bosildi! Play Market ochilishi kutilmoqda...");
            await new Promise(r => setTimeout(r, 7000)); // Play Market sahifasi ochilishi uchun kutish
        } else {
            console.log("Xatolik: Tugma topilmadi!");
        }

        // Play Marketga o'tgan oynani aniqlash
        const pages = await browser.pages();
        const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

        console.log("Hozirgi sahifa URL manzili:", activePage.url());

        // 2. MIDDLE: Play Market sahifasini saqlash
        await activePage.screenshot({ path: '2_middle.png', fullPage: true });
        console.log("2_middle.png (Play Market) saqlandi.");

        // Install / O'rnatish tugmasini bosish
        try {
            await activePage.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('button, span, div, a'));
                const installBtn = elements.find(el => {
                    const text = el.textContent ? el.textContent.toLowerCase() : '';
                    return text.includes('install') || text.includes("o'rnatish") || text.includes('установить');
                });
                if (installBtn) installBtn.click();
            });
            await new Promise(r => setTimeout(r, 3000));
        } catch (e) {}

        // 3. AFTER: Yakuniy holat
        await activePage.screenshot({ path: '3_after.png', fullPage: true });
        console.log("3_after.png saqlandi.");

    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
    } finally {
        await browser.close();
        console.log("Bot ishni yakunladi.");
    }
}

runBot();
