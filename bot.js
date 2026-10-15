const puppeteer = require('puppeteer');

async function runBot() {
    console.log("Bot mobil rejimda (Pixel 5) ishga tushdi...");

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

        // Sayt Linux/Kompyuter ekanligimizni sezmasligi uchun Pixel 5 mobil qurilmasini to'liq emulyatsiya qilamiz
        const pixel5 = puppeteer.devices['Pixel 5'];
        await page.emulate(pixel5);

        console.log("Asosiy ssilkaga kirilmoqda...");
        
        // domcontentloaded - avtomatik sakrab ketishidan oldin birinchi sahifani ushlab qoladi
        await page.goto('https://promo-bot-ucad.onrender.com/r/JT_suzcNFZWTL8QfPWCD6Q', { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 
        });

        // Sahifa elementlari joylashishi uchun qisqa pauza
        await new Promise(r => setTimeout(r, 3000));

        // 1. BEFORE: Boshlang'ich tugmali sahifani aniq ushlab qolib saqlash
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
            // Play Market sahifasi ochilishi va to'liq yuklanishi uchun yetarlicha vaqt beramiz
            await new Promise(r => setTimeout(r, 8000));
        } else {
            console.log("Xatolik: Tugma topilmadi!");
        }

        // Play Marketga o'tgan oynani aniqlash
        const pages = await browser.pages();
        const activePage = pages.length > 1 ? pages[pages.length - 1] : page;

        console.log("Hozirgi sahifa URL manzili:", activePage.url());

        // 2. MIDDLE: Play Market sahifasini saqlash
        await activePage.screenshot({ path: '2_middle.png', fullPage: true });
        console.log("2_middle.png (Play Market sahifasi) saqlandi.");

        // Install / O'rnatish tugmasini bosishga urinish
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
        console.log("3_after.png (yakuniy holat) saqlandi.");

    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
    } finally {
        await browser.close();
        console.log("Bot ishni yakunladi.");
    }
}

runBot();
