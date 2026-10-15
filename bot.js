const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot ishga tushmoqda...");

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();

        // Mobil rejimni xavfsiz qo'lda o'rnatish (xatolik bermaydi)
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');

        console.log("Saytga kirilmoqda...");
        try {
            await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
                waitUntil: 'domcontentloaded', 
                timeout: 60000 
            });
        } catch (err) {
            console.log("Goto ogohlantirishi (davom etamiz):", err.message);
        }

        // Sahifa elementlari yuklanishi uchun qisqa pauza
        await new Promise(r => setTimeout(r, 3000));

        // 1. BEFORE: Boshlang'ich tugmali sahifani saqlash
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png (tugmali sahifa) muvaffaqiyatli saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda...');

        // Tugmani topib bosish
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
            await new Promise(r => setTimeout(r, 7000));
        } else {
            console.log("Xatolik: Tugma topilmadi!");
        }

        // Play Marketga o'tgan oynani aniqlash
        const pages = await browser.pages();
        const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

        console.log("Hozirgi sahifa URL manzili:", activePage.url());

        // 2. MIDDLE: Play Market sahifasini saqlash
        try {
            await activePage.screenshot({ path: '2_middle.png', fullPage: true });
            console.log("2_middle.png (Play Market) saqlandi.");
        } catch (e) {
            console.log("2-rasmni olishda xato:", e.message);
        }

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
        try {
            await activePage.screenshot({ path: '3_after.png', fullPage: true });
            console.log("3_after.png saqlandi.");
        } catch (e) {
            console.log("3-rasmni olishda xato:", e.message);
        }

    } catch (error) {
        console.error("Asosiy xatolik yuz berdi:", error);
    } finally {
        await browser.close();
        console.log("Bot ishni yakunladi.");
    }
}

runBot();
