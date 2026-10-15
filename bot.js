const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Anti-bot rejimida bot ishga tushdi...");

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--ignore-certificate-errors',
            '--window-size=390,844'
        ]
    });

    try {
        const page = await browser.newPage();

        // 1. Haqiqiy Android telefon sifatida to'liq tanitish
        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
        await page.setUserAgent('Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36');

        // 2. Bot ekanligini fosh qiluvchi barcha izlarni yashirish (Stealth)
        await page.evaluateOnNewDocument(() => {
            // Webdriver ni o'chirish
            Object.defineProperty(navigator, 'webdriver', { get: () => false });

            // Chrome obyektini qo'shish
            window.navigator.chrome = { runtime: {} };

            // Tillar va platforma
            Object.defineProperty(navigator, 'languages', { get: () => ['uz-UZ', 'uz', 'en-US', 'en'] });
            Object.defineProperty(navigator, 'platform', { get: () => 'Linux armv7l' });

            // Pluginlar simulyatsiyasi
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        });

        console.log("Asosiy ssilkaga kirilmoqda...");
        
        // domcontentloaded orqali birinchi sahifani ushlab qolish
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });

        // Sahifa to'liq yuklanishi va tugmalar chiqishi uchun ozgina kutish
        await new Promise(r => setTimeout(r, 4000));

        // 1. BEFORE: Dastlabki tugmali sahifani ushlab qolib saqlash
        await page.screenshot({ path: '1_before.png', fullPage: true });
        console.log("1_before.png (tugmali sahifa) muvaffaqiyatli saqlandi.");

        console.log('"Нафақа ёшига етмаган фуқаро" tugmasi qidirilmoqda va bosilmoqda...');

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
            await new Promise(r => setTimeout(r, 8000)); // Play Market sahifasi ochilishi uchun kutish
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
        console.error("Xatolik yuz berdi:", error);
    } finally {
        await browser.close();
        console.log("Bot ishni yakunladi.");
    }
}

runBot();
