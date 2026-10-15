const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot Android rejimida ishga tushdi...");

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

        // Android Pixel 5 qurilmasini to'liq emulyatsiya qilish (sayt bloklamasligi uchun)
        const androidDevice = puppeteer.devices['Pixel 5'];
        await page.emulate(androidDevice);

        console.log("Ssilkaga kirilmoqda...");
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });

        // 1. BEFORE: Tugmali boshlang'ich sahifani ushlab qolish va saqlash
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
